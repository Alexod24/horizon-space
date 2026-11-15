#!/usr/bin/env python3
"""
process_stl.py - QuickMap 3D STL -> Horizon Space public/data/terrain.json
========================================================================
Extracts the top surface vertices (in metres) from a QuickMap 1x1 binary STL
plate, crops +/-RADIUS around the plate centre, resamples onto a regular
size x size ENU grid, and emits the exact terrain.json schema consumed by
src/lib/engine/data.ts (reusing build_payload from process_dem.py).
"""
from __future__ import annotations

import argparse
import json
import struct
import time
from pathlib import Path

import numpy as np
from process_dem import build_payload

STL_DTYPE = np.dtype([("n", "<3f4"), ("v1", "<3f4"), ("v2", "<3f4"), ("v3", "<3f4"), ("attr", "<u2")])


def stl_to_grid(stl_path: str, radius: float, size: int, site_elev: float | None = None) -> tuple[np.ndarray, float]:
    raw = Path(stl_path).read_bytes()
    tri_count = struct.unpack("<I", raw[80:84])[0]
    tris = np.frombuffer(raw[84 : 84 + tri_count * 50], dtype=STL_DTYPE)
    verts = np.vstack([tris["v1"], tris["v2"], tris["v3"]])

    # Drop the flat solid base; keep only the topographic top surface.
    z_min = float(verts[:, 2].min())
    top = verts[verts[:, 2] > z_min + 1.0]

    # Plate coordinates: +X = East, +Y = North; centre of plate = landing site.
    cx = 0.5 * (float(top[:, 0].min()) + float(top[:, 0].max()))
    cy = 0.5 * (float(top[:, 1].min()) + float(top[:, 1].max()))
    px = top[:, 0] - cx
    py = top[:, 1] - cy
    pz = top[:, 2].astype(np.float64)

    # Keep vertices inside a slightly padded crop for clean edge interpolation.
    pad = radius + 2000.0
    mask = (np.abs(px) <= pad) & (np.abs(py) <= pad)
    px, py, pz = px[mask], py[mask], pz[mask]

    # Deduplicate STL triangle vertices by rounding to 0.5 m.
    keys = np.round(px * 2).astype(np.int64) * 1_000_000 + np.round(py * 2).astype(np.int64)
    _, uniq_idx = np.unique(keys, return_index=True)
    px, py, pz = px[uniq_idx], py[uniq_idx], pz[uniq_idx]
    print(f"  STL crop vertices: {len(pz)} unique points within +/-{pad/1000:.0f} km")

    # Resample onto regular ENU grid (row 0 = North, col 0 = West) via IDW of 4 nearest.
    res = 2.0 * radius / (size - 1)
    half = (size - 1) / 2.0
    gx = (np.arange(size) - half) * res
    gy = (half - np.arange(size)) * res
    xx, yy = np.meshgrid(gx, gy)
    qx = xx.ravel()
    qy = yy.ravel()

    # Chunked exact k-NN (k=4) in pure numpy: fast for ~3-5k source pts & 257^2 queries.
    out = np.empty(qx.size, dtype=np.float64)
    chunk = 2048
    for s in range(0, qx.size, chunk):
        e = min(s + chunk, qx.size)
        d2 = (qx[s:e, None] - px[None, :]) ** 2 + (qy[s:e, None] - py[None, :]) ** 2
        idx = np.argpartition(d2, 4, axis=1)[:, :4]
        kd2 = np.take_along_axis(d2, idx, axis=1)
        kz = pz[idx]
        w = 1.0 / np.maximum(kd2, 1e-6)
        out[s:e] = np.sum(w * kz, axis=1) / np.sum(w, axis=1)

    grid = out.reshape(size, size)
    if site_elev is not None:
        grid = grid - site_elev
    return grid, res


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("stl", default="data/raw/qm3d_1x1_1x.stl", nargs="?")
    p.add_argument("--lat", type=float, default=-89.87)
    p.add_argument("--lon", type=float, default=296.36)
    p.add_argument("--radius", type=float, default=15000)
    p.add_argument("--size", type=int, default=257)
    p.add_argument("--observer-height", type=float, default=2.0)
    p.add_argument("--horizon-step", type=float, default=0.5)
    p.add_argument("--out", default="public/data/terrain.json")
    p.add_argument("--context-radius", type=float, default=80000, help="surrounding lunar terrain radius (m)")
    p.add_argument("--context-size", type=int, default=129)
    p.add_argument("--context-out", default="public/data/terrain_context.json")
    a = p.parse_args()

    if a.size % 2 == 0:
        a.size += 1

    t0 = time.perf_counter()
    abs_h, res = stl_to_grid(a.stl, a.radius, a.size)
    payload = build_payload(abs_h, res, "quickmap-stl-enu", a.lat, a.lon, a.observer_height, a.horizon_step)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(
        f"OK {out} ({out.stat().st_size / 1024:.0f} KB) site elev {payload['site']['elevation_m']} m, "
        f"relief {payload['min_m']}..{payload['max_m']} m, {time.perf_counter() - t0:.2f} s"
    )

    if a.context_out:
        ctx_rel, ctx_res = stl_to_grid(a.stl, a.context_radius, a.context_size, site_elev=payload["site"]["elevation_m"])
        ctx_payload = {
            "size": a.context_size,
            "resolution_m": round(ctx_res, 4),
            "heights": np.round(ctx_rel, 1).ravel().tolist(),
        }
        cout = Path(a.context_out)
        cout.write_text(json.dumps(ctx_payload, separators=(",", ":")), encoding="utf-8")
        print(f"OK {cout} ({cout.stat().st_size / 1024:.0f} KB) +/-{a.context_radius/1000:.0f} km context")


if __name__ == "__main__":
    main()
