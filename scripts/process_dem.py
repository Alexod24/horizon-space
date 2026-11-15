#!/usr/bin/env python3
"""
process_dem.py - LOLA DEM -> Horizon Space terrain.json
=======================================================

Cuts a square of +/-RADIUS around the landing site out of a LOLA polar DEM,
re-projects it to a *site-centred* Azimuthal Equidistant grid (so +Y is local
North and azimuths match JPL Horizons exactly), downsamples it to a web-friendly
grid, and writes:

  public/data/terrain.json
  {
    "version": 1,
    "site": {"lat": -89.67, "lon": 129.78, "elevation_m": -4123.4},
    "crs": "+proj=aeqd ...",
    "size": 513, "resolution_m": 58.5,
    "observer_height_m": 2.0, "min_m": ..., "max_m": ...,
    "heights": [... size*size, row 0 = North edge, col 0 = West edge,
                metres RELATIVE to the site ground, 0.1 m precision ...],
    "horizon": {"step_deg": 0.5, "elevation_deg": [... 720 values ...]}
  }

The horizon mask is the precomputed "zero latency" product: at runtime the
occlusion test becomes a single array lookup (see src/lib/engine/occlusion.ts,
which implements the identical ray-march for cross-checking).

Requirements
------------
  numpy, GDAL Python bindings (osgeo). Easiest on Windows:
      conda install -c conda-forge gdal numpy
  or  pip install gdal   (needs a matching GDAL install; OSGeo4W works)

Input
-----
Any single-band elevation raster GDAL can open, with a valid CRS:
  * LOLA PDS3 IMG+LBL   e.g. LDEM_875S_5M.IMG  (87.5S-90S, 5 m/px, polar stereo)
  * GeoTIFF             e.g. a PGDA south-pole site DEM
  * VRT wrapping either
Colourised map exports (RGB/RGBA PNG, e.g. QuickMap "quickmap-lroc.png")
are REJECTED: their pixels encode a colour ramp, not metres.

Usage
-----
  python scripts/process_dem.py data/raw/LDEM_875S_5M.IMG \
      --lat -89.67 --lon 129.78 --radius 15000 --size 513

  python scripts/process_dem.py --selftest   # synthetic crater, no GDAL needed
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
from pathlib import Path

import numpy as np

MOON_R = 1_737_400.0
NODATA = -32768.0


# ----------------------------------------------------------------------------
# 1. GDAL stage: crop + reproject + resample
# ----------------------------------------------------------------------------
def warp_to_site(src_path: str, lat: float, lon: float, radius: float, size: int):
    """Returns (heights[size,size] float64 absolute metres, resolution_m, crs)."""
    from osgeo import gdal, osr  # imported lazily so --selftest works without GDAL

    gdal.UseExceptions()
    src = gdal.Open(src_path)
    if src is None:
        raise SystemExit(f"GDAL cannot open {src_path}")

    if src.RasterCount != 1:
        interp = [gdal.GetColorInterpretationName(src.GetRasterBand(i + 1).GetColorInterpretation())
                  for i in range(src.RasterCount)]
        raise SystemExit(
            f"{src_path} has {src.RasterCount} bands ({', '.join(interp)}). This looks like a "
            "colourised map image, not an elevation model. Download a single-band LOLA LDEM "
            "(heights in metres), e.g. LDEM_875S_5M from the PDS LOLA GDR polar archive."
        )
    band = src.GetRasterBand(1)
    if band.DataType == gdal.GDT_Byte:
        print("! WARNING: 8-bit band - probably a hillshade/greyscale image, not metres.", file=sys.stderr)

    src_srs = osr.SpatialReference(wkt=src.GetProjection())
    if not src.GetProjection():
        raise SystemExit(f"{src_path} has no CRS; cannot locate the site.")
    body_r = src_srs.GetSemiMajor() or MOON_R
    src_res = abs(src.GetGeoTransform()[1])

    # Site-centred azimuthal equidistant on the SAME sphere as the source
    # (avoids PROJ refusing cross-body transforms and keeps distances exact).
    dst_crs = f"+proj=aeqd +lat_0={lat} +lon_0={lon} +x_0=0 +y_0=0 +R={body_r} +units=m +no_defs"
    res = 2.0 * radius / (size - 1)          # pixel centres span exactly +/-radius
    half = size * res / 2.0                  # outer pixel edges
    resample = "average" if res > 1.5 * src_res else "bilinear"

    src_nodata = band.GetNoDataValue()
    print(f"  source: {src.RasterXSize}x{src.RasterYSize} @ {src_res:.2f} m/px, R={body_r:.0f} m, "
          f"nodata={src_nodata}")
    print(f"  warp  : {size}x{size} @ {res:.2f} m/px, resample={resample}")

    dst = gdal.Warp(
        "", src, format="MEM",
        dstSRS=dst_crs,
        outputBounds=(-half, -half, half, half),
        xRes=res, yRes=res,
        resampleAlg=resample,
        srcNodata=src_nodata,
        dstNodata=NODATA,
        outputType=gdal.GDT_Float32,
        multithread=True,
    )
    out_band = dst.GetRasterBand(1)
    # Patch small holes (interpolation gaps) before reading.
    gdal.FillNodata(out_band, None, maxSearchDist=50, smoothingIterations=0)
    arr = out_band.ReadAsArray().astype(np.float64)

    # Apply PDS SCALING_FACTOR / OFFSET if GDAL exposes them.
    scale = band.GetScale() or 1.0
    offset = band.GetOffset() or 0.0
    valid = arr != NODATA
    arr[valid] = arr[valid] * scale + offset
    arr[~valid] = np.nan
    if arr.shape != (size, size):
        raise SystemExit(f"unexpected warp shape {arr.shape}")
    return arr, res, dst_crs


# ----------------------------------------------------------------------------
# 2. Pure-numpy stage: normalise + horizon mask
# ----------------------------------------------------------------------------
def bilinear(h: np.ndarray, res: float, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """ENU metres -> height. Same convention as occlusion.ts::sampleHeight."""
    n = h.shape[0]
    half = (n - 1) / 2
    c = x / res + half
    r = half - y / res
    inside = (c >= 0) & (r >= 0) & (c <= n - 1) & (r <= n - 1)
    c = np.clip(c, 0, n - 1)
    r = np.clip(r, 0, n - 1)
    c0 = np.minimum(np.floor(c).astype(int), n - 2)
    r0 = np.minimum(np.floor(r).astype(int), n - 2)
    fc, fr = c - c0, r - r0
    top = h[r0, c0] * (1 - fc) + h[r0, c0 + 1] * fc
    bot = h[r0 + 1, c0] * (1 - fc) + h[r0 + 1, c0 + 1] * fc
    out = top * (1 - fr) + bot * fr
    out[~inside] = np.nan
    return out


def horizon_mask(h: np.ndarray, res: float, observer_h: float, step_deg: float,
                 step_factor: float = 0.5) -> np.ndarray:
    """Max apparent terrain elevation (deg) per azimuth, with lunar curvature."""
    n = h.shape[0]
    max_d = (n - 1) / 2 * res
    d = np.arange(res * step_factor, max_d + 1e-9, res * step_factor)
    drop = d * d / (2 * MOON_R)
    az = np.deg2rad(np.arange(0, 360, step_deg))
    out = np.empty(az.size)
    for i, a in enumerate(az):
        hh = bilinear(h, res, np.sin(a) * d, np.cos(a) * d)
        tan = (hh - drop - observer_h) / d
        out[i] = np.degrees(np.arctan(np.nanmax(tan))) if np.isfinite(tan).any() else -90.0
    return out


def build_payload(abs_h: np.ndarray, res: float, crs: str, lat: float, lon: float,
                  observer_h: float, step_deg: float) -> dict:
    n = abs_h.shape[0]
    nan_frac = float(np.isnan(abs_h).mean())
    if nan_frac > 0:
        print(f"! {nan_frac:.2%} pixels without data after fill -> set to site elevation", file=sys.stderr)
    c = n // 2
    site_elev = float(abs_h[c, c])
    if not math.isfinite(site_elev):
        raise SystemExit("No elevation at the landing site itself - check --lat/--lon and DEM coverage.")
    rel = np.where(np.isnan(abs_h), 0.0, abs_h - site_elev)

    t = time.perf_counter()
    mask = horizon_mask(rel, res, observer_h, step_deg)
    print(f"  horizon mask: {mask.size} azimuths in {time.perf_counter() - t:.2f} s "
          f"(min {mask.min():.2f} deg, max {mask.max():.2f} deg)")

    return {
        "version": 1,
        "site": {"lat": lat, "lon": lon, "elevation_m": round(site_elev, 2)},
        "crs": crs,
        "size": n,
        "resolution_m": round(res, 4),
        "observer_height_m": observer_h,
        "min_m": round(float(rel.min()), 1),
        "max_m": round(float(rel.max()), 1),
        "heights": np.round(rel, 1).ravel().tolist(),
        "horizon": {"step_deg": step_deg, "elevation_deg": np.round(mask, 3).tolist()},
    }


def synthetic_crater(size: int, radius: float) -> tuple[np.ndarray, float]:
    """Shackleton-like test bowl: 21 km rim diameter, ~4 km deep, site on the floor edge."""
    res = 2.0 * radius / (size - 1)
    half = (size - 1) / 2
    yy, xx = np.mgrid[0:size, 0:size]
    x = (xx - half) * res
    y = (half - yy) * res
    # crater centred 6 km east of the site
    r = np.hypot(x - 6000, y)
    bowl = np.where(r < 10500, -4000 * (1 - (r / 10500) ** 2), 0.0)
    rim = 300 * np.exp(-((r - 10500) / 1200) ** 2)
    ridge = 800 * np.exp(-(((x + 5000) ** 2 + (y - 7000) ** 2) / 4000 ** 2))
    return bowl + rim + ridge - 1500.0, res


# ----------------------------------------------------------------------------
def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("dem", nargs="?", help="input DEM (IMG/TIF/VRT)")
    p.add_argument("--lat", type=float, default=-89.67, help="site latitude (deg)")
    p.add_argument("--lon", type=float, default=129.78, help="site east longitude (deg)")
    p.add_argument("--radius", type=float, default=15000, help="half-width of the tile (m)")
    p.add_argument("--size", type=int, default=513, help="output grid size (odd)")
    p.add_argument("--observer-height", type=float, default=2.0, help="mast height (m)")
    p.add_argument("--horizon-step", type=float, default=0.5, help="mask azimuth step (deg)")
    p.add_argument("--out", default="public/data/terrain.json")
    p.add_argument("--selftest", action="store_true", help="use a synthetic crater (no GDAL)")
    a = p.parse_args()

    if a.size % 2 == 0:
        a.size += 1
        print(f"  size must be odd -> using {a.size}")

    t0 = time.perf_counter()
    if a.selftest:
        abs_h, res = synthetic_crater(a.size, a.radius)
        crs = "synthetic"
    else:
        if not a.dem:
            p.error("DEM path required (or --selftest)")
        abs_h, res, crs = warp_to_site(a.dem, a.lat, a.lon, a.radius, a.size)

    payload = build_payload(abs_h, res, crs, a.lat, a.lon, a.observer_height, a.horizon_step)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"OK {out} ({out.stat().st_size / 1024:.0f} KB) site elev {payload['site']['elevation_m']} m, "
          f"relief {payload['min_m']}..{payload['max_m']} m, {time.perf_counter() - t0:.1f} s")


if __name__ == "__main__":
    main()
