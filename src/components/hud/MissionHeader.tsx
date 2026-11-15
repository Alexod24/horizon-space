"use client";

import { useMissionStore } from "@/store/useMissionStore";

export default function MissionHeader() {
  const terrainSource = useMissionStore((s) => s.data?.terrainSource);
  const missionStarted = useMissionStore((s) => s.missionStarted);
  const setMissionStarted = useMissionStore((s) => s.setMissionStarted);

  return (
    <header className="z-20 flex h-11 shrink-0 items-center justify-between border-b border-sky-500/25 bg-[#070e1a] px-4 text-xs">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-400/60 bg-sky-500/15 text-[10px] font-bold text-sky-300">
          ⌖
        </span>
        <span className="font-semibold tracking-wider text-slate-100">
          HORIZON SPACE <span className="hidden text-slate-400 sm:inline">— NAVIGATOR DE SITIOS DE ATERRIZAJE LUNAR</span>
        </span>
      </div>

      <div className="hidden text-[11px] font-medium tracking-wide text-sky-300/90 md:block">
        MODO &ldquo;WHAT-IF&rdquo;{" "}
        <span className="text-slate-400">(Simulación de Retraso de Lanzamiento)</span>
      </div>

      <div className="flex items-center gap-3">
        {missionStarted && (
          <button
            type="button"
            onClick={() => setMissionStarted(false)}
            className="rounded border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-sky-200 transition hover:bg-sky-500/20"
          >
            ⚙ Configurar Misión
          </button>
        )}
        {terrainSource && (
          <span
            className={`hidden rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider sm:inline ${
              terrainSource === "lola"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}
            title={
              terrainSource === "lola"
                ? "Elevación real LOLA cargada"
                : "Usando relieve sintético hasta procesar LOLA DEM"
            }
          >
            {terrainSource === "lola" ? "LOLA DEM" : "RELIEVE PROVISIONAL"}
          </span>
        )}
        <span className="font-mono text-[11px] tracking-wider text-slate-400">
          Space Apps <strong className="text-slate-100">2026</strong>
        </span>
      </div>
    </header>
  );
}
