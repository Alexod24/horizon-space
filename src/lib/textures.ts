import * as THREE from "three";

// Deterministic PRNG so textures look identical across both Compare viewports.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let moonTex: THREE.CanvasTexture | null = null;
let earthTex: THREE.CanvasTexture | null = null;
let sunTex: THREE.CanvasTexture | null = null;
let sunCoronaTex: THREE.CanvasTexture | null = null;

/** Procedural lunar regolith texture with micro-craters & basaltic grain. */
export function getMoonRegolithTexture(): THREE.CanvasTexture {
  if (moonTex) return moonTex;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(1969);

  ctx.fillStyle = "#7a7d82";
  ctx.fillRect(0, 0, size, size);

  // Fine regolith speckle
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 34;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  // Subtle multi-scale craters + bright ejecta rims
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1.5 + Math.pow(rand(), 3) * 26;
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, "rgba(42, 44, 48, 0.45)");
    g.addColorStop(0.72, "rgba(90, 92, 96, 0.2)");
    g.addColorStop(0.9, "rgba(185, 188, 194, 0.35)");
    g.addColorStop(1, "rgba(122, 125, 130, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  moonTex = new THREE.CanvasTexture(canvas);
  moonTex.wrapS = THREE.RepeatWrapping;
  moonTex.wrapT = THREE.RepeatWrapping;
  moonTex.repeat.set(8, 8);
  moonTex.colorSpace = THREE.SRGBColorSpace;
  return moonTex;
}

/** Procedural Earth texture (oceans, continents, polar caps, cloud wisps). */
export function getEarthTexture(): THREE.CanvasTexture {
  if (earthTex) return earthTex;
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(42);

  // Deep ocean gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#dbeafe");
  bg.addColorStop(0.12, "#0b3b75");
  bg.addColorStop(0.5, "#0e4d92");
  bg.addColorStop(0.88, "#0b3b75");
  bg.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Continent blobs
  for (let i = 0; i < 42; i++) {
    const cx = rand() * w;
    const cy = 28 + rand() * (h - 56);
    const rx = 12 + rand() * 44;
    const ry = 8 + rand() * 26;
    ctx.fillStyle = rand() > 0.35 ? "rgba(46, 125, 75, 0.85)" : "rgba(155, 135, 85, 0.78)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud bands
  for (let i = 0; i < 85; i++) {
    const cx = rand() * w;
    const cy = rand() * h;
    const rx = 18 + rand() * 65;
    const ry = 3 + rand() * 9;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + rand() * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  earthTex = new THREE.CanvasTexture(canvas);
  earthTex.colorSpace = THREE.SRGBColorSpace;
  return earthTex;
}

/** Procedural Sun photosphere texture with granulation & solar flares. */
export function getSunTexture(): THREE.CanvasTexture {
  if (sunTex) return sunTex;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(2026);

  ctx.fillStyle = "#ff9d2e";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 320; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 3 + rand() * 14;
    ctx.fillStyle = rand() > 0.45 ? "rgba(255, 238, 160, 0.35)" : "rgba(217, 72, 15, 0.3)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  sunTex = new THREE.CanvasTexture(canvas);
  sunTex.colorSpace = THREE.SRGBColorSpace;
  return sunTex;
}

/** Smooth radial solar corona + subtle optical diffraction rays (no hard edge). */
export function getSunCoronaTexture(): THREE.CanvasTexture {
  if (sunCoronaTex) return sunCoronaTex;
  const size = 256;
  const c = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Smooth exponential-like radial glow
  const g = ctx.createRadialGradient(c, c, 2, c, c, c);
  g.addColorStop(0.0, "rgba(255, 255, 250, 1.0)");
  g.addColorStop(0.12, "rgba(255, 245, 200, 0.85)");
  g.addColorStop(0.28, "rgba(255, 200, 100, 0.42)");
  g.addColorStop(0.55, "rgba(255, 160, 50, 0.12)");
  g.addColorStop(0.82, "rgba(255, 130, 30, 0.025)");
  g.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Subtle camera lens diffraction spikes
  ctx.save();
  ctx.translate(c, c);
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    const sg = ctx.createLinearGradient(0, 0, c * 0.9, 0);
    sg.addColorStop(0, "rgba(255, 248, 220, 0.28)");
    sg.addColorStop(0.4, "rgba(255, 210, 120, 0.08)");
    sg.addColorStop(1, "rgba(255, 180, 80, 0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(c * 0.9, 0);
    ctx.lineTo(0, 2.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  sunCoronaTex = new THREE.CanvasTexture(canvas);
  sunCoronaTex.colorSpace = THREE.SRGBColorSpace;
  return sunCoronaTex;
}
