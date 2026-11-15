"use client";

import { useEffect } from "react";
import { findNextCrisis, indexAt } from "@/lib/engine/timeline";
import { formatDate } from "@/lib/scene";
import { TRANSIT_PROFILES, useMissionStore } from "@/store/useMissionStore";

const SPEEDS = [6, 24, 72];
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MISSION_DAYS = 7;

function toDateInputUTC(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function fromDateInputPreserveTimeUTC(dateStr: string, currentMs: number): number | null {
  if (!dateStr) return null;
  const cur = new Date(currentMs);
  const p = (n: number) => String(n).padStart(2, "0");
  const iso = `${dateStr}T${p(cur.getUTCHours())}:${p(cur.getUTCMinutes())}:00Z`;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export default function TimelineBar() {
  const data = useMissionStore((s) => s.data);
  const timeMs = useMissionStore((s) => s.timeMs);
  const plannedLaunchMs = useMissionStore((s) => s.plannedLaunchMs);
  const transitDays = useMissionStore((s) => s.transitDays);
  const delayHours = useMissionStore((s) => s.delayHours);
  const compare = useMissionStore((s) => s.compare);
  const terrainMode = useMissionStore((s) => s.terrainMode);
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";
  const playing = useMissionStore((s) => s.playing);
  const speed = useMissionStore((s) => s.speed);
  const advancedHud = useMissionStore((s) => s.advancedHud);
  const setTime = useMissionStore((s) => s.setTime);
  const setTransitDays = useMissionStore((s) => s.setTransitDays);
  const setCompare = useMissionStore((s) => s.setCompare);
  const setTerrainMode = useMissionStore((s) => s.setTerrainMode);
  const setIsolatePole = useMissionStore((s) => s.setIsolatePole);
  const setPlaying = useMissionStore((s) => s.setPlaying);
  const setSpeed = useMissionStore((s) => s.setSpeed);
  const setAdvancedHud = useMissionStore((s) => s.setAdvancedHud);

  useEffect(() => {
    if (!playing || !data) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const dt = (now - last) / 1000;
      last = now;
      const st = useMissionStore.getState();
      if (!st.data) return;
      const maxMs = st.data.timeline.t1Ms - st.transitDays * DAY_MS - st.delayHours * HOUR_MS;
      const missionEndMs = Math.min(st.plannedLaunchMs + MISSION_DAYS * DAY_MS, maxMs);
      const next = st.timeMs + dt * st.speed * HOUR_MS;
      if (next >= missionEndMs) {
        setTime(missionEndMs, false);
        setPlaying(false);
        return;
      }
      setTime(next, false);
      raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, data, setTime, setPlaying]);

  if (!data) return null;

  const { t0Ms, t1Ms, stepMs } = data.timeline;
  const transitMs = transitDays * DAY_MS;
  const delayMs = delayHours * HOUR_MS;
  const maxMs = t1Ms - transitMs - delayMs;
  const span = Math.max(maxMs - t0Ms, 1);
  const pct = ((timeMs - t0Ms) / span) * 100;
  const delayPct = Math.min(((timeMs + delayMs - t0Ms) / span) * 100, 100);
  const touchdownMs = timeMs + transitMs;
  const elapsedDays = Math.max(0, (timeMs - plannedLaunchMs) / DAY_MS);
  const pastGuaranteedWindow = elapsedDays > MISSION_DAYS + 0.05;

  const togglePlay = () => {
    if (!playing) {
      const missionEndMs = Math.min(plannedLaunchMs + MISSION_DAYS * DAY_MS, maxMs);
      if (timeMs >= missionEndMs - stepMs || timeMs < plannedLaunchMs) {
        setTime(plannedLaunchMs, false);
      }
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

  const jumpToNextCrisis = () => {
    const minTouchdownIdx = Math.ceil(transitMs / stepMs);
    const currentTouchdownIdx = Math.max(
      minTouchdownIdx,
      indexAt(data.timeline, touchdownMs) + 1,
    );
    const delaySteps = Math.round(delayMs / stepMs);
    let hit = findNextCrisis(data.vis, currentTouchdownIdx, delaySteps);
    if (hit < 0) hit = findNextCrisis(data.vis, minTouchdownIdx, delaySteps);
    if (hit >= 0) setTime(data.timeline.t0Ms + hit * stepMs - transitMs);
  };

  return (
    <div className="z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-800 bg-[#161616] px-4 py-2 text-xs">
      {/* Play + Speed */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pausar simulación" : "Reproducir simulación"}
          className="flex h-7 w-7 items-center justify-center rounded border border-neutral-700 bg-neutral-900 text-white transition hover:border-neutral-500 hover:bg-neutral-800"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        {advancedHud && (
          <div className="hidden items-center gap-1 sm:flex">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded border px-1.5 py-1 font-mono text-[10px] transition ${speed === s
                  ? "border-white bg-white font-semibold text-black"
                  : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
              >
                {s}h/s
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compact Launch Date (T-0) + Transit Profile Selectors (Advanced mode) */}
      {advancedHud && (
        <div className="hidden items-center gap-2 xl:flex">
          <label className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[10px]">
            <span className="font-semibold tracking-wider text-neutral-400">
              {en ? "LAUNCH (T-0):" : "LANZAMIENTO (T-0):"}
            </span>
            <input
              type="date"
              min={toDateInputUTC(t0Ms)}
              max={toDateInputUTC(maxMs)}
              value={toDateInputUTC(timeMs)}
              onChange={(e) => {
                const parsed = fromDateInputPreserveTimeUTC(e.target.value, timeMs);
                if (parsed !== null) setTime(parsed);
              }}
              aria-label={en ? "Launch date (T-0)" : "Fecha de lanzamiento (T-0)"}
              className="bg-transparent font-mono text-[11px] font-semibold text-white outline-none"
            />
          </label>

          <label className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[10px]">
            <span className="font-semibold tracking-wider text-neutral-400">
              {en ? "TRANSIT:" : "TRÁNSITO:"}
            </span>
            <select
              value={transitDays}
              onChange={(e) => setTransitDays(Number(e.target.value))}
              aria-label={en ? "Transit profile" : "Perfil de tránsito"}
              className="cursor-pointer bg-neutral-900 font-mono text-[11px] font-semibold text-white outline-none"
            >
              {TRANSIT_PROFILES.map((tp) => (
                <option key={tp.days} value={tp.days} className="bg-neutral-900 text-white">
                  {en ? tp.labelEn : tp.labelEs}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Center Slider + Launch -> Touchdown Date */}
      <div className="flex min-w-[240px] flex-1 flex-col items-center">
        <div className="mb-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400">
          <span>
            {en ? "Launch (T-0):" : "Lanzamiento (T-0):"}{" "}
            <strong className="font-mono font-semibold text-neutral-200">{formatDate(timeMs, lang)}</strong>
          </span>
          <span className="font-mono text-neutral-500">➔ +{transitDays}d ➔</span>
          <span>
            {en ? "Touchdown:" : "Alunizaje:"}{" "}
            <strong className="font-mono font-semibold text-white">{formatDate(touchdownMs, lang)}</strong>
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
              pastGuaranteedWindow
                ? "border-amber-500/60 bg-amber-950/50 text-amber-300"
                : "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
            }`}
          >
            {pastGuaranteedWindow
              ? en
                ? `⚠ Day ${elapsedDays.toFixed(1)} (>7d guaranteed)`
                : `⚠ Día ${elapsedDays.toFixed(1)} (fuera de los 7d asegurados)`
              : en
                ? `Day ${elapsedDays.toFixed(1)} / 7.0 guaranteed`
                : `Día ${elapsedDays.toFixed(1)} / 7.0 asegurados`}
          </span>
        </div>

        <div className="relative flex w-full max-w-2xl items-center">
          <input
            type="range"
            min={t0Ms}
            max={maxMs}
            step={stepMs}
            value={timeMs}
            onChange={(e) => setTime(Number(e.target.value))}
            aria-label="Control maestro de fecha de lanzamiento y alunizaje"
            className="horizon-range relative z-10 w-full"
            style={{ ["--pct" as string]: `${pct}%` }}
          />
          {/* +48h crisis marker */}
          <div
            className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${delayPct}%` }}
          >
            <div className="h-3 w-3 rounded-full border-2 border-[#ff9a3c] bg-[#161616]" />
            <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-neutral-200">
              +{delayHours}H
            </span>
          </div>
        </div>
      </div>

      {/* Right actions: Terrain filter + Isolate Pole + Jump to crisis + Compare toggle + Advanced toggle */}
      <div className="flex items-center gap-2">
        {advancedHud && (
          <>
            <div className="hidden items-center overflow-hidden rounded border border-neutral-800 bg-neutral-900 text-[10px] sm:flex">
              <button
                type="button"
                onClick={() => setTerrainMode("realistic")}
                className={`px-2 py-1 font-medium transition ${terrainMode === "realistic" ? "bg-white text-black" : "text-neutral-400 hover:text-neutral-200"
                  }`}
              >
                {en ? "Realistic" : "Realista"}
              </button>
              <button
                type="button"
                onClick={() => setTerrainMode("tactical")}
                className={`px-2 py-1 font-medium transition ${terrainMode === "tactical" ? "bg-white text-black" : "text-neutral-400 hover:text-neutral-200"
                  }`}
              >
                {en ? "Tactical" : "Táctico"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsolatePole(!isolatePole)}
              title={en ? "Show South Pole area only (15 km radius)" : "Mostrar únicamente el área del Polo Sur (radio 15 km)"}
              className={`hidden rounded border px-2 py-1 text-[10px] font-medium transition sm:inline-block ${isolatePole
                ? "border-white bg-white text-black"
                : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
                }`}
            >
              {isolatePole ? (en ? "South Pole Only ✓" : "Solo Polo Sur ✓") : (en ? "South Pole Only" : "Solo Polo Sur")}
            </button>
          </>
        )}

        <button
          onClick={jumpToNextCrisis}
          className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
          title={en ? "Jump to next instant where delay causes sun or comms loss" : "Saltar al próximo instante donde el retraso provoca pérdida de luz o enlace"}
        >
          {en ? "Next crisis" : "Siguiente crisis"}
        </button>

        <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] font-medium text-neutral-300">
          <span>{en ? "Compare" : "Comparar"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={compare}
            onClick={() => setCompare(!compare)}
            className={`relative h-5 w-9 rounded-full border transition ${compare ? "border-white bg-white" : "border-neutral-700 bg-neutral-900"
              }`}
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${compare ? "left-4 bg-black" : "left-0.5 bg-neutral-400"
                }`}
            />
          </button>
        </label>

        <button
          type="button"
          onClick={() => setAdvancedHud(!advancedHud)}
          className={`rounded border px-2.5 py-1 text-[11px] font-medium transition ${
            advancedHud
              ? "border-white bg-white font-semibold text-black"
              : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800"
          }`}
        >
          ⚙ {advancedHud ? (en ? "Simple View" : "Vista Simple") : (en ? "Advanced" : "Avanzado")}
        </button>
      </div>
    </div>
  );
}
