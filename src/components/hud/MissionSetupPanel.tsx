"use client";

import { findNextCrisis, indexAt } from "@/lib/engine/timeline";
import { useMissionStore } from "@/store/useMissionStore";

const DELAYS = [24, 48, 72];

function toDatetimeLocalUTC(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

function fromDatetimeLocalUTC(val: string): number | null {
  if (!val) return null;
  const ms = Date.parse(val + ":00Z");
  return Number.isFinite(ms) ? ms : null;
}

export default function MissionSetupPanel() {
  const data = useMissionStore((s) => s.data);
  const timeMs = useMissionStore((s) => s.timeMs);
  const delayHours = useMissionStore((s) => s.delayHours);
  const landingSite = useMissionStore((s) => s.landingSite);
  const setTime = useMissionStore((s) => s.setTime);
  const setDelay = useMissionStore((s) => s.setDelay);
  const setLandingSite = useMissionStore((s) => s.setLandingSite);
  const setMissionStarted = useMissionStore((s) => s.setMissionStarted);

  if (!data) return null;

  const { t0Ms, t1Ms, stepMs } = data.timeline;
  const minStr = toDatetimeLocalUTC(t0Ms);
  const maxStr = toDatetimeLocalUTC(t1Ms - delayHours * 3.6e6);
  const distKm = Math.hypot(landingSite.x, landingSite.y);

  const suggestCrisis = () => {
    const idx = indexAt(data.timeline, timeMs) + 1;
    const delaySteps = Math.round((delayHours * 3.6e6) / stepMs);
    let hit = findNextCrisis(data.vis, idx, delaySteps);
    if (hit < 0) hit = findNextCrisis(data.vis, 0, delaySteps);
    if (hit >= 0) setTime(t0Ms + hit * stepMs);
  };

  return (
    <aside className="z-20 flex w-full shrink-0 flex-col justify-between gap-4 overflow-y-auto border-l border-sky-500/30 bg-[#07101e]/95 p-4 text-xs shadow-2xl backdrop-blur-md lg:w-80">
      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-sky-400">FASE 1 · PLANIFICACIÓN</div>
          <h2 className="mt-0.5 text-sm font-bold text-white">Configurar Misión Lunar</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Marca tu punto de aterrizaje haciendo clic sobre el cráter (izquierda) y define la fecha y hora UTC del lanzamiento.
          </p>
        </div>

        {/* 1. Landing Site */}
        <div className="rounded-md border border-sky-500/25 bg-[#0a1628] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.16em] text-slate-300">1. SITIO DE ATERRIZAJE</span>
            <button
              type="button"
              onClick={() => setLandingSite(0, 0)}
              className="text-[10px] text-sky-400 hover:text-sky-300"
            >
              Centrar (0, 0)
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="rounded bg-black/40 p-1.5">
              <div className="text-[9px] text-slate-500">ESTE (X)</div>
              <div className="font-bold text-white">{landingSite.x >= 0 ? "+" : ""}{landingSite.x.toFixed(2)} km</div>
            </div>
            <div className="rounded bg-black/40 p-1.5">
              <div className="text-[9px] text-slate-500">NORTE (Y)</div>
              <div className="font-bold text-white">{landingSite.y >= 0 ? "+" : ""}{landingSite.y.toFixed(2)} km</div>
            </div>
            <div className="rounded bg-black/40 p-1.5">
              <div className="text-[9px] text-slate-500">ELEVACIÓN</div>
              <div className="font-bold text-sky-300">{landingSite.elevationM >= 0 ? "+" : ""}{landingSite.elevationM.toFixed(0)} m</div>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400">
            Distancia al centro: <span className="font-mono text-slate-200">{distKm.toFixed(2)} km</span> / 15.00 km
          </div>
        </div>

        {/* 2. Date & Time */}
        <div className="rounded-md border border-sky-500/25 bg-[#0a1628] p-3">
          <label htmlFor="launch-dt" className="block text-[10px] font-bold tracking-[0.16em] text-slate-300">
            2. FECHA Y HORA DE LANZAMIENTO (UTC)
          </label>
          <input
            id="launch-dt"
            type="datetime-local"
            min={minStr}
            max={maxStr}
            value={toDatetimeLocalUTC(timeMs)}
            onChange={(e) => {
              const parsed = fromDatetimeLocalUTC(e.target.value);
              if (parsed !== null) setTime(parsed);
            }}
            className="mt-2 w-full rounded border border-sky-500/35 bg-[#050c17] px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-sky-400"
          />
          <button
            type="button"
            onClick={suggestCrisis}
            className="mt-2 w-full rounded border border-[#ff9a3c]/45 bg-[#ff9a3c]/10 px-2 py-1 text-[10px] font-semibold text-[#ff9a3c] transition hover:bg-[#ff9a3c]/20"
          >
            ⚡ Buscar fecha con crisis de retraso
          </button>
        </div>

        {/* 3. Delay */}
        <div className="rounded-md border border-sky-500/25 bg-[#0a1628] p-3">
          <div className="text-[10px] font-bold tracking-[0.16em] text-slate-300">3. RETRASO A SIMULAR</div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {DELAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDelay(d)}
                className={`rounded border py-1.5 font-mono text-xs font-bold transition ${
                  delayHours === d
                    ? "border-[#ff9a3c] bg-[#ff9a3c]/20 text-[#ff9a3c]"
                    : "border-white/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                +{d}H
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMissionStarted(true)}
        className="w-full rounded-md border border-sky-400/80 bg-sky-500/25 py-2.5 text-xs font-bold tracking-widest text-white shadow-[0_0_20px_rgba(61,184,255,0.25)] transition hover:bg-sky-500/35"
      >
        INICIAR SIMULACIÓN ▶
      </button>
    </aside>
  );
}
