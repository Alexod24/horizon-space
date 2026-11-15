/**
 * PLACEHOLDER terrain (metres) until the real LOLA DEM is processed into
 * /data/terrain.json. Shaped like a crater-rim site: bowl to the south,
 * massifs on the horizon tuned so that the real JPL ephemeris produces a
 * realistic mix of light/dark and link/no-link periods.
 */
import type { TerrainMatrix } from "./engine/occlusion";

const g = (x: number, y: number, cx: number, cy: number, h: number, s: number) =>
  h * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (s * s));

function rawHeight(x: number, y: number): number {
  // Crater bowl, centre 10.5 km south of the site (site sits on the rim).
  const r = Math.hypot(x, y + 10500);
  const bowl = r < 10000 ? -2600 * (1 - (r / 10000) ** 2) : 0;
  const rim = 120 * Math.exp(-(((r - 10300) / 900) ** 2));
  const massifWNW = g(x, y, -7000, 4200, 330, 2600);
  const ridgeSW = g(x, y, -9200, -8200, 210, 2200);
  const hillE = g(x, y, 9000, 2200, 210, 2000);
  const peakN = g(x, y, 1500, 11500, 260, 2400);
  const noise =
    18 * Math.sin(x / 700) * Math.cos(y / 900) +
    9 * Math.sin((x + y) / 330) +
    5 * Math.cos((x - 2 * y) / 170);
  return bowl + rim + massifWNW + ridgeSW + hillE + peakN + noise;
}

export function buildPlaceholderTerrain(size = 257, radius = 15000): TerrainMatrix {
  const res = (2 * radius) / (size - 1);
  const half = (size - 1) / 2;
  const h0 = rawHeight(0, 0);
  const heights = new Float32Array(size * size);
  let max = -Infinity;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const v = rawHeight((c - half) * res, (half - r) * res) - h0;
      heights[r * size + c] = v;
      if (v > max) max = v;
    }
  return { size, resolution: res, heights, maxHeight: max };
}
