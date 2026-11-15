/**
 * data.ts — loaders + O(1) time lookup for the precomputed static datasets.
 * No React / three.js dependencies; safe to use in workers.
 */
import type { AzEl, TerrainMatrix } from "./occlusion";

export interface OrbitalSample {
  time: string; // ISO-8601 UTC, e.g. "2026-01-01T00:15Z"
  sun: AzEl;
  earth: AzEl;
}

export interface OrbitalTimeline {
  samples: OrbitalSample[];
  t0Ms: number;
  stepMs: number;
  t1Ms: number;
}

export interface TerrainFile {
  version: number;
  site: { lat: number; lon: number; elevation_m: number };
  crs: string;
  size: number;
  resolution_m: number;
  observer_height_m: number;
  min_m: number;
  max_m: number;
  heights: number[];
  horizon: { step_deg: number; elevation_deg: number[] };
}

export async function loadOrbitalTimeline(url = "/data/orbital_data.json"): Promise<OrbitalTimeline> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`orbital data: HTTP ${res.status}`);
  const samples = (await res.json()) as OrbitalSample[];
  if (samples.length < 2) throw new Error("orbital data: need ≥ 2 samples");
  const t0Ms = Date.parse(samples[0].time);
  const stepMs = Date.parse(samples[1].time) - t0Ms;
  return { samples, t0Ms, stepMs, t1Ms: Date.parse(samples[samples.length - 1].time) };
}

export async function loadTerrain(url = "/data/terrain.json"): Promise<{ file: TerrainFile; matrix: TerrainMatrix; mask: Float32Array }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`terrain: HTTP ${res.status}`);
  const file = (await res.json()) as TerrainFile;
  if (file.heights.length !== file.size * file.size) throw new Error("terrain: heights length ≠ size²");
  const matrix: TerrainMatrix = {
    size: file.size,
    resolution: file.resolution_m,
    heights: Float32Array.from(file.heights),
    maxHeight: file.max_m,
  };
  return { file, matrix, mask: Float32Array.from(file.horizon.elevation_deg) };
}

export async function loadTerrainContext(url = "/data/terrain_context.json"): Promise<TerrainMatrix | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const raw = (await res.json()) as { size: number; resolution_m: number; heights: number[] };
    if (raw.heights.length !== raw.size * raw.size) return null;
    return { size: raw.size, resolution: raw.resolution_m, heights: Float32Array.from(raw.heights) };
  } catch {
    return null;
  }
}

const lerp = (a: number, b: number, w: number) => a + (b - a) * w;
/** Shortest-path azimuth interpolation across the 360/0 seam. */
function lerpAz(a: number, b: number, w: number) {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * w + 360) % 360;
}

/** Sun/Earth az-el at an arbitrary instant (linear interpolation, clamped). */
export function sampleOrbital(tl: OrbitalTimeline, timeMs: number): { sun: AzEl; earth: AzEl } {
  const f = Math.min(Math.max((timeMs - tl.t0Ms) / tl.stepMs, 0), tl.samples.length - 1);
  const i = Math.min(Math.floor(f), tl.samples.length - 2);
  const w = f - i;
  const a = tl.samples[i], b = tl.samples[i + 1];
  return {
    sun: { az: lerpAz(a.sun.az, b.sun.az, w), el: lerp(a.sun.el, b.sun.el, w) },
    earth: { az: lerpAz(a.earth.az, b.earth.az, w), el: lerp(a.earth.el, b.earth.el, w) },
  };
}
