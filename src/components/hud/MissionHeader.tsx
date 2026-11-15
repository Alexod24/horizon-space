"use client";

import { useMissionStore } from "@/store/useMissionStore";

export default function MissionHeader() {
  const terrainSource = useMissionStore((s) => s.data?.terrainSource);
  const missionStarted = useMissionStore((s) => s.missionStarted);
  const setMissionStarted = useMissionStore((s) => s.setMissionStarted);

  return (
    <header className="z-20 flex h-11 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#141414] px-4 text-xs">
      <div className="flex items-center gap-2.5">
        <img
          src="/icon.jpg"
          alt="Horizon Space"
          className="h-7 w-7 rounded border border-neutral-800 object-cover"
        />
        <span className="font-semibold tracking-tight text-white">
          Horizon Space{" "}
          <span className="hidden font-normal text-neutral-500 sm:inline">
            / Navigator de Sitios de Aterrizaje Lunar
          </span>
        </span>
      </div>

      <div className="hidden text-[11px] font-medium text-neutral-400 md:block">
        Modo <span className="text-white">&ldquo;What-If&rdquo;</span> · Simulación de Retraso
      </div>

      <div className="flex items-center gap-2.5">
        {missionStarted && (
          <button
            type="button"
            onClick={() => setMissionStarted(false)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            Configurar Misión
          </button>
        )}
        {terrainSource && (
          <span
            className="hidden rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-300 sm:inline"
            title={
              terrainSource === "lola"
                ? "Elevación real LOLA cargada"
                : "Usando relieve sintético hasta procesar LOLA DEM"
            }
          >
            {terrainSource === "lola" ? "LOLA DEM" : "RELIEVE PROVISIONAL"}
          </span>
        )}
        <span className="font-mono text-[11px] text-neutral-500">
          Space Apps <strong className="text-neutral-200">2026</strong>
        </span>
      </div>
    </header>
  );
}
