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
