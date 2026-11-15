#!/usr/bin/env node
/**
 * build-orbital-data.mjs
 * ----------------------------------------------------------------------------
 * Cleans two JPL Horizons observer tables (CSV mode, quantities Azi/Elev
 * "a-app") and merges them into public/data/orbital_data.json:
 *
 *   [{ "time": "2026-01-01T00:00Z", "sun": { "az": 262.732, "el": 1.304 },
 *                                   "earth": { "az": 228.913, "el": 6.065 } }, ...]
 *
 * Usage:
 *   node scripts/build-orbital-data.mjs [--sun data/raw/sun_horizons.txt]
 *        [--earth data/raw/earth_horizons.txt] [--out public/data/orbital_data.json]
 *        [--precision 3]
 *
 * Only rows between $$SOE and $$EOE are parsed; everything else (physical
 * data header, column legend, footer) is discarded. Rows present in only one
 * table are dropped and reported. Zero dependencies.
 */
import { createReadStream, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const SUN = resolve(args.sun ?? "data/raw/sun_horizons.txt");
const EARTH = resolve(args.earth ?? "data/raw/earth_horizons.txt");
const OUT = resolve(args.out ?? "public/data/orbital_data.json");
const PRECISION = Number(args.precision ?? 3);

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const round = (v) => Number(v.toFixed(PRECISION));

/** "2026-Jan-01 00:15" (optionally with :SS) -> "2026-01-01T00:15Z" */
function toIso(raw) {
  const m = /^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/.exec(raw.trim());
  if (!m) return null;
  const mm = MONTHS[m[2]];
  if (!mm) return null;
  const sec = m[6] ? `:${m[6].padStart(2, "0")}` : "";
  return `${m[1]}-${String(mm).padStart(2, "0")}-${m[3]}T${m[4]}:${m[5]}${sec}Z`;
}

/**
 * Parses one Horizons file. Column positions are taken from the header line
 * immediately above $$SOE so the script survives extra/different quantities.
 * @returns {Promise<{meta: Record<string,string>, rows: Map<string,{az:number,el:number}>}>}
 */
async function parseHorizons(path) {
  const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  const meta = {};
  const rows = new Map();
  let header = null;
  let prev = [];
  let inTable = false;
  let iTime = 0, iAz = -1, iEl = -1;
  let skipped = 0;

  for await (const line of rl) {
    if (!inTable) {
      const kv = /^(Target body name|Center body name|Center geodetic|Step-size|Start time|Stop {2}time)\s*:\s*(.+?)\s*$/.exec(line);
      if (kv) meta[kv[1].replace(/\s+/g, " ")] = kv[2];
      if (line.startsWith("$$SOE")) {
        // Header is the last non-separator line before $$SOE.
        header = prev.reverse().find((l) => l.trim() && !/^\*+$/.test(l.trim()));
        if (!header) throw new Error(`${path}: no column header found before $$SOE`);
        const cols = header.split(",").map((c) => c.trim());
        iTime = cols.findIndex((c) => c.startsWith("Date"));
        iAz = cols.findIndex((c) => c.startsWith("Azi"));
        iEl = cols.findIndex((c) => c.startsWith("Elev"));
        if (iTime < 0 || iAz < 0 || iEl < 0)
          throw new Error(`${path}: header lacks Date/Azi/Elev columns -> "${header}"`);
        inTable = true;
      } else {
        prev.push(line);
        if (prev.length > 5) prev.shift();
      }
      continue;
    }
    if (line.startsWith("$$EOE")) break;

    const f = line.split(",");
    const time = toIso(f[iTime] ?? "");
    const az = Number.parseFloat(f[iAz]);
    const el = Number.parseFloat(f[iEl]);
    if (!time || !Number.isFinite(az) || !Number.isFinite(el)) {
      skipped++;
      continue;
    }
    rows.set(time, { az: round(az), el: round(el) });
  }
  if (!inTable) throw new Error(`${path}: $$SOE marker not found (is this a Horizons CSV table?)`);
  return { meta, rows, skipped };
}

function assertSameSite(a, b) {
  const ga = a.meta["Center geodetic"], gb = b.meta["Center geodetic"];
  if (ga && gb && ga !== gb) throw new Error(`Observer sites differ:\n  sun:   ${ga}\n  earth: ${gb}`);
}

const t0 = performance.now();
const [sun, earth] = await Promise.all([parseHorizons(SUN), parseHorizons(EARTH)]);

if (!/Sun/i.test(sun.meta["Target body name"] ?? "")) console.warn(`! --sun target is "${sun.meta["Target body name"]}"`);
if (!/Earth/i.test(earth.meta["Target body name"] ?? "")) console.warn(`! --earth target is "${earth.meta["Target body name"]}"`);
assertSameSite(sun, earth);

const out = [];
let onlySun = 0;
for (const [time, s] of sun.rows) {
  const e = earth.rows.get(time);
  if (!e) { onlySun++; continue; }
  out.push({ time, sun: s, earth: e });
}
const onlyEarth = earth.rows.size - out.length;
out.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

// Uniform-step check (the runtime does O(1) index lookup, so gaps matter).
const stepMs = out.length > 1 ? Date.parse(out[1].time) - Date.parse(out[0].time) : 0;
let gaps = 0;
for (let i = 1; i < out.length; i++) if (Date.parse(out[i].time) - Date.parse(out[i - 1].time) !== stepMs) gaps++;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));

const kb = (statSync(OUT).size / 1024).toFixed(0);
console.log(`✓ ${out.length} samples  ${out[0]?.time} → ${out.at(-1)?.time}  step ${stepMs / 60000} min`);
console.log(`  site: ${sun.meta["Center geodetic"] ?? "?"}`);
console.log(`  unmatched rows: sun-only ${onlySun}, earth-only ${onlyEarth}; unparsable: sun ${sun.skipped}, earth ${earth.skipped}`);
if (gaps) console.warn(`! ${gaps} non-uniform steps detected — runtime index lookup will be approximate`);
console.log(`  wrote ${OUT} (${kb} KB) in ${(performance.now() - t0).toFixed(0)} ms`);
