"use client";

import { findNextCrisis, indexAt } from "@/lib/engine/timeline";
import { DEFAULT_VEHICLE, VEHICLES } from "@/lib/vehicles";
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
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const setTime = useMissionStore((s) => s.setTime);
  const setDelay = useMissionStore((s) => s.setDelay);
  const setLandingSite = useMissionStore((s) => s.setLandingSite);
  const setVehicle = useMissionStore((s) => s.setVehicle);
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
    <aside className="z-20 flex w-full shrink-0 flex-col justify-between gap-4 overflow-y-auto border-l border-neutral-800 bg-[#141414] p-4 text-xs lg:w-80">
      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.16em] text-neutral-500">FASE 1 · PLANIFICACIÓN</div>
          <h2 className="mt-0.5 text-base font-semibold text-white">Configurar Misión Lunar</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            Marca tu punto de aterrizaje haciendo clic sobre el cráter (izquierda) y define la fecha y hora UTC del lanzamiento.
          </p>
        </div>

        {/* 1. Landing Site */}
        <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-neutral-300">1. SITIO DE ATERRIZAJE</span>
            <button
              type="button"
              onClick={() => setLandingSite(0, 0)}
              className="text-[10px] text-neutral-400 underline-offset-2 hover:text-white hover:underline"
            >
              Centrar (0, 0)
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="rounded border border-neutral-800 bg-[#111111] p-1.5">
              <div className="text-[9px] text-neutral-500">ESTE (X)</div>
              <div className="font-semibold text-white">{landingSite.x >= 0 ? "+" : ""}{landingSite.x.toFixed(2)} km</div>
            </div>
            <div className="rounded border border-neutral-800 bg-[#111111] p-1.5">
              <div className="text-[9px] text-neutral-500">NORTE (Y)</div>
              <div className="font-semibold text-white">{landingSite.y >= 0 ? "+" : ""}{landingSite.y.toFixed(2)} km</div>
            </div>
            <div className="rounded border border-neutral-800 bg-[#111111] p-1.5">
              <div className="text-[9px] text-neutral-500">ELEVACIÓN</div>
              <div className="font-semibold text-white">{landingSite.elevationM >= 0 ? "+" : ""}{landingSite.elevationM.toFixed(0)} m</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-neutral-500">
            Distancia al centro: <span className="font-mono text-neutral-300">{distKm.toFixed(2)} km</span> / 15.00 km
          </div>
        </div>

        {/* 2. Date & Time */}
        <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
          <label htmlFor="launch-dt" className="block text-[10px] font-semibold tracking-[0.12em] text-neutral-300">
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
            className="mt-2 w-full rounded border border-neutral-700 bg-[#111111] px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-white"
          />
          <button
            type="button"
            onClick={suggestCrisis}
            className="mt-2 w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-[10px] font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            Buscar fecha con crisis de retraso
          </button>
        </div>

        {/* 3. Vehicle Selector */}
        <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-neutral-300">
              3. EQUIPO / MÓDULO LUNAR
            </span>
            <span className="text-[9px] text-neutral-500">Opcional</span>
          </div>

          <button
            type="button"
            onClick={() => setVehicle(DEFAULT_VEHICLE.id)}
            className={`mb-2 flex w-full items-center justify-between rounded border px-2.5 py-1.5 text-left text-[11px] transition ${
              vehicleId === DEFAULT_VEHICLE.id
                ? "border-white bg-white font-semibold text-black"
                : "border-neutral-800 bg-[#111111] text-neutral-300 hover:border-neutral-600"
            }`}
          >
            <span>Sin equipo específico (Default)</span>
            <span className="font-mono text-[9px] opacity-80">2.0m · 48h</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {VEHICLES.map((v) => {
              const selected = v.id === vehicleId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicle(v.id)}
                  title={v.summary}
                  className={`group flex flex-col overflow-hidden rounded border text-left transition ${
                    selected
                      ? "border-white bg-neutral-900 ring-1 ring-white"
                      : "border-neutral-800 bg-[#111111] hover:border-neutral-600"
                  }`}
                >
                  <div className="relative h-24 w-full overflow-hidden bg-[#111111] p-1">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="h-full w-full object-contain transition duration-200 group-hover:scale-105"
                    />
                    <span className="absolute right-1 top-1 rounded bg-black/80 px-1 py-0.5 font-mono text-[8px] text-neutral-200">
                      {v.heightM.toFixed(1)}m
                    </span>
                  </div>
                  <div className="border-t border-neutral-800/80 p-1.5">
                    <div className="truncate text-[10px] font-semibold text-white">{v.name}</div>
                    <div className="truncate text-[9px] text-neutral-500">{v.agency}</div>
                    <div className="mt-0.5 font-mono text-[9px] text-neutral-300">
                      Batería: {v.maxDarkHours}h
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Delay */}
        <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
          <div className="text-[10px] font-semibold tracking-[0.12em] text-neutral-300">4. RETRASO A SIMULAR</div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {DELAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDelay(d)}
                className={`rounded border py-1.5 font-mono text-xs font-semibold transition ${delayHours === d
                  ? "border-white bg-white text-black"
                  : "border-neutral-800 bg-[#111111] text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
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
        className="w-full rounded-md bg-white py-2.5 text-xs font-bold tracking-wider text-black transition hover:bg-neutral-200"
      >
        Iniciar Simulación
      </button>
    </aside>
  );
}
