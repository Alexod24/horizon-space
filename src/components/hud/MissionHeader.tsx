"use client";

import LangToggle from "@/components/hud/LangToggle";
import { useMissionStore } from "@/store/useMissionStore";

export default function MissionHeader() {
  const missionStarted = useMissionStore((s) => s.missionStarted);
  const plannedLaunchMs = useMissionStore((s) => s.plannedLaunchMs);
  const setEnteredApp = useMissionStore((s) => s.setEnteredApp);
  const setMissionStarted = useMissionStore((s) => s.setMissionStarted);
  const setPlaying = useMissionStore((s) => s.setPlaying);
  const setTime = useMissionStore((s) => s.setTime);
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";

  const goHome = () => {
    setPlaying(false);
    setMissionStarted(false);
    setEnteredApp(false);
  };

  return (
    <header className="z-20 flex h-11 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#141414] px-4 text-xs">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={goHome}
          title={en ? "Back to Landing Page" : "Volver a la página de inicio"}
          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
        >
          <span>←</span>
          <span>{en ? "Home" : "Inicio"}</span>
        </button>
        <img
          src="/icon.jpg"
          alt="Horizon Space"
          className="h-7 w-7 rounded border border-neutral-800 object-cover"
        />
        <span className="font-semibold tracking-tight text-white">
          Horizon Space{" "}
          <span className="hidden font-normal text-neutral-500 sm:inline">
            {en ? "/ Lunar Landing Site Navigator" : "/ Navigator de Sitios de Aterrizaje Lunar"}
          </span>
        </span>
      </div>

      <div className="hidden text-[11px] font-medium text-neutral-400 md:block">
        {en ? (
          <>
            <span className="text-white">&ldquo;What-If&rdquo;</span> Mode · Delay Simulation
          </>
        ) : (
          <>
            Modo <span className="text-white">&ldquo;What-If&rdquo;</span> · Simulación de Retraso
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <LangToggle />
        {missionStarted && (
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setTime(plannedLaunchMs, false);
              setMissionStarted(false);
            }}
            className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            {en ? "Configure Mission" : "Configurar Misión"}
          </button>
        )}
        <span className="hidden font-mono text-[11px] text-neutral-500 sm:inline">
          Space Apps <strong className="text-neutral-200">2026</strong>
        </span>
      </div>
    </header>
  );
}
