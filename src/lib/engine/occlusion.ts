/**
 * occlusion.ts — Horizon Space line-of-sight engine (dependency-free).
 *
 * Frame: local topocentric ENU centred on the landing site.
 *   x = East (m), y = North (m), z = Up (m).
 *   Azimuth: degrees clockwise from North (JPL Horizons convention).
 *   Elevation: degrees above the local horizontal plane at the site.
 *
 * Mapping to three.js (y-up): three.x = x, three.y = z, three.z = -y.
 *
 * Terrain grid (as produced by scripts/process_dem.py):
 *   heights[row * size + col], row 0 = NORTH edge, col 0 = WEST edge,
 *   values in metres RELATIVE to the ground at the site (centre pixel = 0).
 *   Pixel (r, c) centre: x = (c - (size-1)/2) * resolution,
 *                        y = ((size-1)/2 - r) * resolution.
 */

export const MOON_RADIUS_M = 1_737_400;
const DEG = Math.PI / 180;

export interface TerrainMatrix {
  /** Grid is size × size, odd so the site sits exactly on the centre pixel. */
  size: number;
  /** Metres per pixel. */
  resolution: number;
  /** Row-major relative heights in metres. */
  heights: ArrayLike<number>;
  /** Optional cached max height (speeds up early exit). */
  maxHeight?: number;
}

export interface AzEl {
  /** Degrees clockwise from North. */
  az: number;
  /** Degrees above local horizontal. */
  el: number;
}
export interface EnuVector {
  x: number; // East
  y: number; // North
  z: number; // Up
}
export type BodyDirection = AzEl | EnuVector;

export interface OcclusionOptions {
  /** Landing site East/North offset from grid centre (m). Default 0, 0. */
  observerX?: number;
  observerY?: number;
  /** Antenna / solar-panel height above local ground at the site (m). Default 2. */
  observerHeight?: number;
  /** Ray-march step as a fraction of the grid resolution. Default 0.5. */
  stepFactor?: number;
  /** Include lunar curvature drop d²/2R. Default true (≈65 m at 15 km!). */
  curvature?: boolean;
  /**
   * Angular radius (deg) of the body to require fully visible. 0 = test body
   * centre (default). Use 0.267 for "whole solar disc", -0.267 for "any limb".
   */
  bodyRadiusDeg?: number;
}

export interface OcclusionResult {
  sun: boolean;
  earth: boolean;
  /** true if either Sun or Earth is blocked — the "red alert" condition. */
  any: boolean;
  /** Terrain horizon elevation (deg) along each body's azimuth. */
  sunHorizonDeg: number;
  earthHorizonDeg: number;
  /** Body elevation minus horizon (deg). Negative = blocked. */
  sunMarginDeg: number;
  earthMarginDeg: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

export function toAzEl(d: BodyDirection): AzEl {
  if ("az" in d) return d;
  const horiz = Math.hypot(d.x, d.y);
  const az = (Math.atan2(d.x, d.y) / DEG + 360) % 360;
  return { az, el: Math.atan2(d.z, horiz) / DEG };
}

export function azElToEnu({ az, el }: AzEl): EnuVector {
  const a = az * DEG, e = el * DEG;
  return { x: Math.sin(a) * Math.cos(e), y: Math.cos(a) * Math.cos(e), z: Math.sin(e) };
}

function maxOf(t: TerrainMatrix): number {
  if (t.maxHeight !== undefined) return t.maxHeight;
  let m = -Infinity;
  for (let i = 0; i < t.heights.length; i++) if (t.heights[i] > m) m = t.heights[i];
  t.maxHeight = m;
  return m;
}

/** Bilinear height at ENU (x, y) metres. NaN outside the grid. */
export function sampleHeight(t: TerrainMatrix, x: number, y: number): number {
  const half = (t.size - 1) / 2;
  const c = x / t.resolution + half;
  const r = half - y / t.resolution;
  if (c < 0 || r < 0 || c > t.size - 1 || r > t.size - 1) return NaN;
  const c0 = Math.min(Math.floor(c), t.size - 2);
  const r0 = Math.min(Math.floor(r), t.size - 2);
  const fc = c - c0, fr = r - r0;
  const h = t.heights, n = t.size, i = r0 * n + c0;
  const top = h[i] * (1 - fc) + h[i + 1] * fc;
  const bot = h[i + n] * (1 - fc) + h[i + n + 1] * fc;
  return top * (1 - fr) + bot * fr;
}

/**
 * Highest apparent terrain elevation (deg) along an azimuth, seen from the site.
 * If `stopAboveDeg` is given, returns as soon as the horizon exceeds it.
 */
export function horizonElevation(
  t: TerrainMatrix,
  azDeg: number,
  opts: OcclusionOptions = {},
  stopAboveDeg = Infinity,
): number {
  const ox = opts.observerX ?? 0;
  const oy = opts.observerY ?? 0;
  const ground = sampleHeight(t, ox, oy);
  const h0 = (Number.isNaN(ground) ? 0 : ground) + (opts.observerHeight ?? 2);
  const step = t.resolution * (opts.stepFactor ?? 0.5);
  const curv = opts.curvature ?? true;
  const maxD = ((t.size - 1) / 2) * t.resolution * 2;
  const hMax = maxOf(t);
  const dx = Math.sin(azDeg * DEG), dy = Math.cos(azDeg * DEG);
  const hasStop = Number.isFinite(stopAboveDeg);
  const stopTan = hasStop ? Math.tan(Math.max(-89.9, Math.min(89.9, stopAboveDeg)) * DEG) : Infinity;

  let best = -Infinity; // tan of the highest apparent elevation
  for (let d = step; d <= maxD; d += step) {
    // Upper bound for any terrain beyond d (ignores curvature ⇒ conservative).
    // Past this point nothing can beat `best`, nor reach the stop threshold.
    const ceiling = (hMax - h0) / d;
    if (ceiling <= best || (hasStop && ceiling < stopTan)) break;
    const h = sampleHeight(t, ox + dx * d, oy + dy * d);
    if (Number.isNaN(h)) break; // left the grid
    const drop = curv ? (d * d) / (2 * MOON_RADIUS_M) : 0;
    const tan = (h - drop - h0) / d;
    if (tan > best) {
      best = tan;
      if (best >= stopTan) break;
    }
  }
  return best === -Infinity ? -90 : Math.atan(best) / DEG;
}

/** True when terrain blocks the line of sight towards `body`. */
export function isOccluded(t: TerrainMatrix, body: BodyDirection, opts: OcclusionOptions = {}): boolean {
  const { az, el } = toAzEl(body);
  const need = el - (opts.bodyRadiusDeg ?? 0);
  return horizonElevation(t, az, opts, need) >= need;
}

/**
 * Exact 3D ray-terrain hit distance (metres) from the landing site towards `body`,
 * or `null` if the line of sight clears the local relief.
 */
export function findImpactDistance(t: TerrainMatrix, body: BodyDirection, opts: OcclusionOptions = {}): number | null {
  const { az, el } = toAzEl(body);
  const ox = opts.observerX ?? 0;
  const oy = opts.observerY ?? 0;
  const ground = sampleHeight(t, ox, oy);
  const h0 = (Number.isNaN(ground) ? 0 : ground) + (opts.observerHeight ?? 2);
  const step = t.resolution * (opts.stepFactor ?? 0.5);
  const curv = opts.curvature ?? true;
  const maxD = ((t.size - 1) / 2) * t.resolution * 2;
  const dx = Math.sin(az * DEG), dy = Math.cos(az * DEG);
  const rayTan = Math.tan(Math.max(-89.9, Math.min(89.9, el)) * DEG);

  for (let d = step; d <= maxD; d += step) {
    const h = sampleHeight(t, ox + dx * d, oy + dy * d);
    if (Number.isNaN(h)) break;
    const drop = curv ? (d * d) / (2 * MOON_RADIUS_M) : 0;
    if (h - drop >= h0 + d * rayTan) return d;
  }
  return null;
}

/**
 * Core entry point: are the Sun and/or Earth hidden behind local relief?
 * Direct ray-march, ~O(size) per body. For per-frame use across the whole
 * mission timeline prefer buildHorizonMask() + occlusionFromMask().
 */
export function calculateOcclusion(
  sunVector: BodyDirection,
  earthVector: BodyDirection,
  terrainMatrix: TerrainMatrix,
  opts: OcclusionOptions = {},
): OcclusionResult {
  const s = toAzEl(sunVector), e = toAzEl(earthVector);
  const sunHorizonDeg = horizonElevation(terrainMatrix, s.az, opts);
  const earthHorizonDeg = horizonElevation(terrainMatrix, e.az, opts);
  const r = opts.bodyRadiusDeg ?? 0;
  const sunMarginDeg = s.el - r - sunHorizonDeg;
  const earthMarginDeg = e.el - r - earthHorizonDeg;
  const sun = sunMarginDeg <= 0;
  const earth = earthMarginDeg <= 0;
  return { sun, earth, any: sun || earth, sunHorizonDeg, earthHorizonDeg, sunMarginDeg, earthMarginDeg };
}

// ─── zero-latency path: precomputed horizon mask ───────────────────────────

/** Horizon elevation (deg) for azimuths 0, step, 2·step, … < 360. */
export function buildHorizonMask(t: TerrainMatrix, stepDeg = 0.5, opts: OcclusionOptions = {}): Float32Array {
  const n = Math.round(360 / stepDeg);
  const mask = new Float32Array(n);
  for (let i = 0; i < n; i++) mask[i] = horizonElevation(t, i * stepDeg, opts);
  return mask;
}

/** Linearly interpolated horizon elevation from a mask (wraps at 360°). */
export function maskHorizonAt(mask: ArrayLike<number>, stepDeg: number, azDeg: number): number {
  const n = mask.length;
  const f = (((azDeg % 360) + 360) % 360) / stepDeg;
  const i = Math.floor(f) % n;
  const w = f - Math.floor(f);
  return mask[i] * (1 - w) + mask[(i + 1) % n] * w;
}

/** O(1) occlusion test against a precomputed horizon mask. */
export function occlusionFromMask(
  mask: ArrayLike<number>,
  stepDeg: number,
  sunVector: BodyDirection,
  earthVector: BodyDirection,
  bodyRadiusDeg = 0,
): OcclusionResult {
  const s = toAzEl(sunVector), e = toAzEl(earthVector);
  const sunHorizonDeg = maskHorizonAt(mask, stepDeg, s.az);
  const earthHorizonDeg = maskHorizonAt(mask, stepDeg, e.az);
  const sunMarginDeg = s.el - bodyRadiusDeg - sunHorizonDeg;
  const earthMarginDeg = e.el - bodyRadiusDeg - earthHorizonDeg;
  const sun = sunMarginDeg <= 0;
  const earth = earthMarginDeg <= 0;
  return { sun, earth, any: sun || earth, sunHorizonDeg, earthHorizonDeg, sunMarginDeg, earthMarginDeg };
}
