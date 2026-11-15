/**
 * timeline.ts — precomputes Sun/Earth visibility for every ephemeris sample
 * (≈70k samples → ~15 ms) so windows, percentages and "next event" queries are
 * O(1) at runtime.
 */
import type { OrbitalTimeline } from "./data";
import { occlusionFromMask } from "./occlusion";

export interface Visibility {
  n: number;
  sunVis: Uint8Array; // 1 = Sun above local terrain horizon
  earthVis: Uint8Array; // 1 = direct line of sight to Earth
  sunNext: Int32Array; // index of next state change (n = never within data)
  earthNext: Int32Array;
  sunPrefix: Uint32Array; // prefix sums for fast "% visible over window"
  earthPrefix: Uint32Array;
}

function nextChange(v: Uint8Array): Int32Array {
  const n = v.length;
  const out = new Int32Array(n);
  out[n - 1] = n;
  for (let i = n - 2; i >= 0; i--) out[i] = v[i] !== v[i + 1] ? i + 1 : out[i + 1];
  return out;
}
function prefix(v: Uint8Array): Uint32Array {
  const out = new Uint32Array(v.length + 1);
  for (let i = 0; i < v.length; i++) out[i + 1] = out[i] + v[i];
  return out;
}

export function computeVisibility(tl: OrbitalTimeline, mask: ArrayLike<number>, stepDeg: number): Visibility {
  const n = tl.samples.length;
  const sunVis = new Uint8Array(n);
  const earthVis = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const s = tl.samples[i];
    const r = occlusionFromMask(mask, stepDeg, s.sun, s.earth);
    sunVis[i] = r.sun ? 0 : 1;
    earthVis[i] = r.earth ? 0 : 1;
  }
  return {
    n, sunVis, earthVis,
    sunNext: nextChange(sunVis), earthNext: nextChange(earthVis),
    sunPrefix: prefix(sunVis), earthPrefix: prefix(earthVis),
  };
}

export function indexAt(tl: OrbitalTimeline, ms: number): number {
  const i = Math.round((ms - tl.t0Ms) / tl.stepMs);
  return Math.min(Math.max(i, 0), tl.samples.length - 1);
}

export interface WindowInfo {
  visible: boolean;
  /** ms until the state flips; Infinity if not within the data span. */
  msToChange: number;
}
export function windowAt(vis: Uint8Array, next: Int32Array, i: number, stepMs: number): WindowInfo {
  const j = next[i];
  return { visible: vis[i] === 1, msToChange: j >= vis.length ? Infinity : (j - i) * stepMs };
}

export function fractionVisible(pre: Uint32Array, i: number, steps: number): number {
  const end = Math.min(i + steps, pre.length - 1);
  return end > i ? (pre[end] - pre[i]) / (end - i) : 0;
}

/** First index ≥ from where nominal is fully safe and nominal+delay is not. */
export function findNextCrisis(v: Visibility, from: number, delaySteps: number): number {
  for (let i = from; i + delaySteps < v.n; i++) {
    const nomOk = v.sunVis[i] & v.earthVis[i];
    const crisisOk = v.sunVis[i + delaySteps] & v.earthVis[i + delaySteps];
    if (nomOk && !crisisOk) return i;
  }
  return -1;
}

export type ViabilityTier = "OPTIMAL" | "MARGINAL" | "CRITICAL";

export interface MissionViability {
  /** Overall Mission Viability Score (0 - 100). */
  score: number;
  tier: ViabilityTier;
  /** Solar availability over mission duration (0 - 100%). */
  solarPct: number;
  /** Direct Earth LOS over mission duration (0 - 100%). */
  earthPct: number;
  /** Delay resilience score over mission duration at +delayHours (0 - 100%). */
  delayResiliencePct: number;
  /** True if the delayed touchdown lands in occlusion (Sun or Earth blocked). */
  delayOccluded: boolean;
  /** True if the delayed touchdown shadow exceeds lander battery limit. */
  delayThermalFreeze: boolean;
  /** Hours until first solar occlusion on nominal touchdown (Infinity if none in 7d). */
  firstSolarDropHours: number | null;
  /** Recommended optimal touchdown index, launchMs, and viability score. */
  optimal: {
    touchdownIndex: number;
    launchMs: number;
    touchdownMs: number;
    deltaDays: number;
    score: number;
  } | null;
}

/** Fast O(1) evaluation of a single touchdown index using precomputed prefix sums. */
export function scoreTouchdownIndex(
  v: Visibility,
  idx: number,
  delaySteps: number,
  missionSteps: number,
  maxDarkSteps: number,
): {
  score: number;
  solarPct: number;
  earthPct: number;
  delayResiliencePct: number;
  delayOccluded: boolean;
  delayThermalFreeze: boolean;
  bothTouchdownsClean: boolean;
} {
  const safeIdx = Math.min(Math.max(idx, 0), v.n - 1);
  const crisisIdx = Math.min(safeIdx + delaySteps, v.n - 1);

  const solarFrac = fractionVisible(v.sunPrefix, safeIdx, missionSteps);
  const earthFrac = fractionVisible(v.earthPrefix, safeIdx, missionSteps);

  const delSolarFrac = fractionVisible(v.sunPrefix, crisisIdx, missionSteps);
  const delEarthFrac = fractionVisible(v.earthPrefix, crisisIdx, missionSteps);

  const nomTouchdownOk = v.sunVis[safeIdx] === 1 && v.earthVis[safeIdx] === 1;
  const delTouchdownOk = v.sunVis[crisisIdx] === 1 && v.earthVis[crisisIdx] === 1;
  const delayOccluded = !delTouchdownOk;

  const crisisDarkSteps = v.sunVis[crisisIdx] === 0 ? v.sunNext[crisisIdx] - crisisIdx : 0;
  const delayThermalFreeze = v.sunVis[crisisIdx] === 0 && crisisDarkSteps > maxDarkSteps;

  let resilienceFrac = 0.6 * delSolarFrac + 0.4 * delEarthFrac;
  if (delayThermalFreeze) {
    resilienceFrac = 0;
  } else if (delayOccluded) {
    resilienceFrac *= 0.35;
  }

  let rawScore = 50 * solarFrac + 30 * earthFrac + 20 * resilienceFrac;
  if (!nomTouchdownOk) {
    rawScore *= 0.65;
  }

  const score = Math.round(Math.min(100, Math.max(0, rawScore)) * 10) / 10;
  return {
    score,
    solarPct: Math.round(solarFrac * 1000) / 10,
    earthPct: Math.round(earthFrac * 1000) / 10,
    delayResiliencePct: Math.round(resilienceFrac * 1000) / 10,
    delayOccluded,
    delayThermalFreeze,
    bothTouchdownsClean: nomTouchdownOk && delTouchdownOk && !delayThermalFreeze,
  };
}

export function calculateMissionViability(
  tl: OrbitalTimeline,
  v: Visibility,
  launchMs: number,
  transitDays: number,
  delayHours: number,
  maxDarkHours: number,
  missionDays = 7,
): MissionViability {
  const DAY_MS = 86_400_000;
  const HOUR_MS = 3_600_000;
  const transitMs = transitDays * DAY_MS;
  const touchdownMs = launchMs + transitMs;
  const idx = indexAt(tl, touchdownMs);
  const delaySteps = Math.round((delayHours * HOUR_MS) / tl.stepMs);
  const missionSteps = Math.round((missionDays * DAY_MS) / tl.stepMs);
  const maxDarkSteps = Math.round((maxDarkHours * HOUR_MS) / tl.stepMs);

  const cur = scoreTouchdownIndex(v, idx, delaySteps, missionSteps, maxDarkSteps);

  let tier: ViabilityTier = "CRITICAL";
  if (cur.score >= 85 && cur.bothTouchdownsClean) {
    tier = "OPTIMAL";
  } else if (cur.score >= 60 && !cur.delayThermalFreeze) {
    tier = "MARGINAL";
  }

  let firstSolarDropHours: number | null = null;
  if (v.sunVis[idx] === 1) {
    const nextDrop = v.sunNext[idx] - idx;
    if (nextDrop < missionSteps) {
      firstSolarDropHours = Math.round((nextDrop * tl.stepMs) / HOUR_MS);
    }
  } else {
    firstSolarDropHours = 0;
  }

  // Search forward (+35 days) from current touchdown index for the next optimal 7-day window
  const minIdx = Math.ceil(transitMs / tl.stepMs);
  const maxIdx = Math.max(minIdx, v.n - delaySteps - missionSteps - 1);
  const searchRadiusSteps = Math.round((35 * DAY_MS) / tl.stepMs);
  const lo = Math.min(maxIdx, Math.max(minIdx, idx + 4));
  const hi = Math.min(maxIdx, idx + searchRadiusSteps);

  let bestIdx = idx;
  let bestScore = cur.score;
  let bestClean = cur.bothTouchdownsClean;

  const evaluateCandidate = (i: number) => {
    const c = scoreTouchdownIndex(v, i, delaySteps, missionSteps, maxDarkSteps);
    const betterClean = c.bothTouchdownsClean && !bestClean;
    const sameClean = c.bothTouchdownsClean === bestClean;
    if (betterClean || (sameClean && c.score > bestScore + 0.4)) {
      bestIdx = i;
      bestScore = c.score;
      bestClean = c.bothTouchdownsClean;
    } else if (sameClean && Math.abs(c.score - bestScore) <= 0.4 && c.score > cur.score + 1) {
      if (Math.abs(i - idx) < Math.abs(bestIdx - idx)) {
        bestIdx = i;
        bestScore = c.score;
      }
    }
  };

  for (let i = lo; i <= hi; i += 2) {
    evaluateCandidate(i);
  }
  // If local 30-day window didn't find an OPTIMAL date, scan full timeline coarsely
  if (bestScore < 85 || !bestClean) {
    for (let i = minIdx; i <= maxIdx; i += 16) {
      evaluateCandidate(i);
    }
  }

  let optimal: MissionViability["optimal"] = null;
  if (bestIdx !== idx && (bestScore > cur.score + 1.5 || (bestClean && !cur.bothTouchdownsClean))) {
    const optTouchdownMs = tl.t0Ms + bestIdx * tl.stepMs;
    const optLaunchMs = optTouchdownMs - transitMs;
    const deltaDays = Math.round(((optLaunchMs - launchMs) / DAY_MS) * 10) / 10;
    optimal = {
      touchdownIndex: bestIdx,
      launchMs: optLaunchMs,
      touchdownMs: optTouchdownMs,
      deltaDays,
      score: bestScore,
    };
  }

  return {
    score: cur.score,
    tier,
    solarPct: cur.solarPct,
    earthPct: cur.earthPct,
    delayResiliencePct: cur.delayResiliencePct,
    delayOccluded: cur.delayOccluded,
    delayThermalFreeze: cur.delayThermalFreeze,
    firstSolarDropHours,
    optimal,
  };
}
