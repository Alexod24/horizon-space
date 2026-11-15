"use client";

import { useEffect } from "react";
import { findNextCrisis, indexAt } from "@/lib/engine/timeline";
import { formatDate } from "@/lib/scene";
import { useMissionStore } from "@/store/useMissionStore";

const SPEEDS = [6, 24, 72];

export default function TimelineBar() {
  const data = useMissionStore((s) => s.data);
  const timeMs = useMissionStore((s) => s.timeMs);
  const delayHours = useMissionStore((s) => s.delayHours);
  const compare = useMissionStore((s) => s.compare);
  const terrainMode = useMissionStore((s) => s.terrainMode);
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const playing = useMissionStore((s) => s.playing);
  const speed = useMissionStore((s) => s.speed);
  const setTime = useMissionStore((s) => s.setTime);
  const setCompare = useMissionStore((s) => s.setCompare);
  const setTerrainMode = useMissionStore((s) => s.setTerrainMode);
  const setIsolatePole = useMissionStore((s) => s.setIsolatePole);
  const setPlaying = useMissionStore((s) => s.setPlaying);
  const setSpeed = useMissionStore((s) => s.setSpeed);

  useEffect(() => {
    if (!playing || !data) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const dt = (now - last) / 1000;
      last = now;
      const st = useMissionStore.getState();
      if (!st.data) return;
      const maxMs = st.data.timeline.t1Ms - st.delayHours * 3.6e6;
      const next = st.timeMs + dt * st.speed * 3.6e6;
      setTime(next >= maxMs ? st.data.timeline.t0Ms : next);
      raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, data, setTime]);

  if (!data) return null;

  const { t0Ms, t1Ms, stepMs } = data.timeline;
  const maxMs = t1Ms - delayHours * 3.6e6;
  const span = Math.max(maxMs - t0Ms, 1);
  const pct = ((timeMs - t0Ms) / span) * 100;
  const delayPct = Math.min(((timeMs + delayHours * 3.6e6 - t0Ms) / span) * 100, 100);

  const jumpToNextCrisis = () => {
    const idx = indexAt(data.timeline, timeMs) + 1;
    const delaySteps = Math.round((delayHours * 3.6e6) / stepMs);
    let hit = findNextCrisis(data.vis, idx, delaySteps);
    if (hit < 0) hit = findNextCrisis(data.vis, 0, delaySteps);
    if (hit >= 0) setTime(data.timeline.t0Ms + hit * stepMs);
  };

  return (
    <div className="z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-sky-500/20 bg-[#08111f] px-4 py-2 text-xs">
      {/* Play + Speed */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pausar simulación" : "Reproducir simulación"}
          className="flex h-7 w-7 items-center justify-center rounded border border-sky-400/40 bg-sky-500/10 text-sky-300 transition hover:bg-sky-500/20"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded border px-1.5 py-1 font-mono text-[10px] transition ${
                speed === s
                  ? "border-sky-400/60 bg-sky-500/20 text-sky-200"
                  : "border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}h/s
            </button>
          ))}
        </div>
      </div>

      {/* Center Slider + Date */}
      <div className="flex min-w-[240px] flex-1 flex-col items-center">
        <div className="mb-0.5 flex items-center gap-2 text-[11px] tracking-wide text-slate-300">
          <span className="text-slate-400">FECHA DE ATERRIZAJE:</span>
          <span className="font-mono font-semibold text-white">{formatDate(timeMs)}</span>
        </div>

        <div className="relative flex w-full max-w-2xl items-center">
          <input
            type="range"
            min={t0Ms}
            max={maxMs}
            step={stepMs}
            value={timeMs}
            onChange={(e) => setTime(Number(e.target.value))}
            aria-label="Control maestro de fecha de aterrizaje"
            className="horizon-range relative z-10 w-full"
            style={{ ["--pct" as string]: `${pct}%` }}
          />
          {/* +48h crisis marker */}
          <div
            className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${delayPct}%` }}
          >
            <div className="h-3.5 w-3.5 rounded-full border-2 border-[#ff9a3c] bg-[#08111f] shadow-[0_0_10px_#ff9a3c]" />
            <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded border border-[#ff9a3c]/60 bg-[#2a1707]/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#ff9a3c]">
              RETRASO +{delayHours}H
            </span>
          </div>
        </div>
      </div>

      {/* Right actions: Terrain filter + Jump to crisis + Compare toggle */}
      <div className="flex items-center gap-2.5">
        <div className="hidden items-center overflow-hidden rounded border border-white/15 bg-slate-900/70 text-[10px] sm:flex">
          <button
            type="button"
            onClick={() => setTerrainMode("realistic")}
            className={`px-2 py-1 font-medium transition ${
              terrainMode === "realistic" ? "bg-sky-500/25 text-sky-200" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            REALISTA
          </button>
          <button
            type="button"
            onClick={() => setTerrainMode("tactical")}
            className={`px-2 py-1 font-medium transition ${
              terrainMode === "tactical" ? "bg-sky-500/25 text-sky-200" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            TÁCTICO
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsolatePole(!isolatePole)}
          title="Mostrar únicamente el área del Polo Sur (radio 15 km)"
          className={`hidden rounded border px-2 py-1 text-[10px] font-medium transition sm:inline-block ${
            isolatePole
              ? "border-sky-400/70 bg-sky-500/20 text-sky-200"
              : "border-white/15 text-slate-400 hover:text-slate-200"
          }`}
        >
          {isolatePole ? "SOLO POLO SUR ✓" : "SOLO POLO SUR"}
        </button>

        <button
          onClick={jumpToNextCrisis}
          className="rounded border border-[#ff9a3c]/45 bg-[#ff9a3c]/10 px-2.5 py-1 text-[11px] font-medium text-[#ff9a3c] transition hover:bg-[#ff9a3c]/20"
          title="Saltar al próximo instante donde un retraso de 48h provoca pérdida de luz o enlace"
        >
          ⚡ Siguiente crisis
        </button>

        <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-200">
          <span>COMPARAR</span>
          <button
            type="button"
            role="switch"
            aria-checked={compare}
            onClick={() => setCompare(!compare)}
            className={`relative h-5 w-10 rounded-full border transition ${
              compare ? "border-sky-400 bg-sky-500/30" : "border-white/20 bg-slate-800"
            }`}
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
                compare ? "left-5 bg-sky-300 shadow-[0_0_8px_#3db8ff]" : "left-0.5 bg-slate-400"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
