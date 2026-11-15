import * as THREE from "three";

/** True 1:1 scale (1 unit = 1 km) so real Shackleton relief (-5.6..+1.9 km)
 * renders with accurate lunar crater proportions without vertical distortion. */
export const VERT_EXAG = 1;
export const TERRAIN_RADIUS = 15; // scene units = km
export const DOME_R = 15;

export const COLORS = {
  sun: "#ff9a3c",
  earth: "#3db8ff",
  danger: "#ff3b4e",
  safe: "#3ee08f",
};

export function exaggerateEl(elDeg: number): number {
  return THREE.MathUtils.radToDeg(Math.atan(VERT_EXAG * Math.tan(THREE.MathUtils.degToRad(elDeg))));
}

/** az/el (deg, true values) → scene position on a sphere of radius r. */
export function skyPoint(azDeg: number, elDeg: number, r = DOME_R): THREE.Vector3 {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(exaggerateEl(elDeg));
  return new THREE.Vector3(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, -Math.cos(az) * Math.cos(el) * r);
}

export function formatDuration(ms: number, lang: "es" | "en" = "es"): string {
  if (!Number.isFinite(ms)) return lang === "en" ? "> end of data" : "> fin de datos";
  const totalMin = Math.round(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDate(ms: number, lang: "es" | "en" = "es"): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  const months = lang === "en" ? MONTHS_EN : MONTHS_ES;
  return `${p(d.getUTCDate())}/${months[d.getUTCMonth()]}/${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

export function formatCoord(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}°${lat < 0 ? "S" : "N"}, ${lon.toFixed(2)}°E`;
}
