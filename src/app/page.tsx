"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CompactMetricsCard, DetailedMetricsCards } from "@/components/hud/CriticalMetrics";
import LandingPage from "@/components/hud/LandingPage";
import MissionHeader from "@/components/hud/MissionHeader";
import MissionSetupPanel from "@/components/hud/MissionSetupPanel";
import OperationalAlert from "@/components/hud/OperationalAlert";
import SiteSidebar from "@/components/hud/SiteSidebar";
import TimelineBar from "@/components/hud/TimelineBar";
import { loadOrbitalTimeline, loadTerrain, loadTerrainContext } from "@/lib/engine/data";
import { buildHorizonMask } from "@/lib/engine/occlusion";
import { computeVisibility, findNextCrisis } from "@/lib/engine/timeline";
import { buildPlaceholderTerrain } from "@/lib/placeholderTerrain";
import { formatCoord } from "@/lib/scene";
import { SITES } from "@/lib/sites";
import { useMissionStore } from "@/store/useMissionStore";

const HorizonScene = dynamic(() => import("@/components/scene/HorizonScene"), { ssr: false });

function ViewportCard({
  title,
  coords,
  offsetHours,
  ghostOffsetHours,
  terrainSource,
}: {
  title: string;
  coords: string;
  offsetHours: number;
  ghostOffsetHours?: number;
  terrainSource: "lola" | "placeholder";
}) {
  const outOfBoundsKm = useMissionStore((s) => s.outOfBoundsKm);
  const setOutOfBoundsKm = useMissionStore((s) => s.setOutOfBoundsKm);
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const setIsolatePole = useMissionStore((s) => s.setIsolatePole);
  const triggerCenter = useMissionStore((s) => s.triggerCenter);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(document.fullscreenElement === cardRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!cardRef.current) return;
    if (document.fullscreenElement === cardRef.current) document.exitFullscreen();
    else cardRef.current.requestFullscreen().catch(() => {});
  };

  return (
    <div ref={cardRef} className="relative min-h-[300px] flex-1 overflow-hidden rounded-md border border-neutral-800 bg-[#0a0a0a] sm:min-h-[360px] lg:min-h-0">
      <HorizonScene offsetHours={offsetHours} ghostOffsetHours={ghostOffsetHours} />

      {/* Top overlay bar (responsive wrap so label and buttons never collide on mobile) */}
      <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 z-10 flex flex-wrap items-start justify-between gap-2 sm:left-3 sm:right-3 sm:top-3">
        <div className="max-w-full rounded border border-neutral-800 bg-[#141414]/85 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[10px] font-semibold tracking-wide text-neutral-100 sm:text-[11px]">{title}</div>
          <div className="font-mono text-[9px] text-neutral-400 sm:text-[10px]">COORDS: {coords} · CÚPULA R = 15 KM</div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsolatePole(!isolatePole)}
            title={isolatePole ? "Cambiar a mapa completo (±80 km)" : "Mostrar solo Polo Sur (15 km)"}
            className={`flex h-7 items-center gap-1 rounded border px-2 text-[10px] font-medium backdrop-blur-sm transition sm:px-2.5 ${
              isolatePole
                ? "border-neutral-600 bg-neutral-800/90 text-white"
                : "border-neutral-700 bg-[#141414]/85 text-neutral-300 hover:border-neutral-500 hover:text-white"
            }`}
          >
            {isolatePole ? "Solo Polo Sur" : "Mapa Completo"}
          </button>

          <button
            type="button"
            onClick={triggerCenter}
            title="Centrar cámara en el sitio de aterrizaje"
            aria-label="Centrar cámara en el sitio de aterrizaje"
            className="flex h-7 items-center gap-1 rounded border border-neutral-700 bg-[#141414]/85 px-2 text-[10px] font-medium text-neutral-200 backdrop-blur-sm transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white sm:px-2.5"
          >
            <span aria-hidden="true">⌖</span>
            <span>Centrar</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFs ? "Salir de pantalla completa" : "Ver en pantalla completa"}
            aria-label={isFs ? "Salir de pantalla completa" : "Ver en pantalla completa"}
            className="flex h-7 w-7 items-center justify-center rounded border border-neutral-700 bg-[#141414]/85 text-xs text-neutral-200 backdrop-blur-sm transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            {isFs ? "✕" : "⛶"}
          </button>
        </div>
      </div>

      {/* Out-of-bounds UX alert when clicking outside the 15 km South Pole dome */}
      {outOfBoundsKm !== null && (
        <div className="absolute right-12 top-3 z-20 flex max-w-xs items-start gap-2 rounded border border-neutral-700 bg-[#191919]/95 px-3 py-2 text-[11px] text-neutral-100 shadow-lg backdrop-blur-sm">
          <div className="flex-1">
            <div className="font-semibold tracking-wide text-amber-300">
              ⚠ Fuera de zona Polo Sur ({outOfBoundsKm} km &gt; 15 km)
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-neutral-400">
              El análisis de oclusión y efemérides aplica dentro del radio de 15 km de la cúpula. Haz clic dentro del perímetro para volver.
            </p>
          </div>
          <button
            onClick={() => setOutOfBoundsKm(null)}
            aria-label="Cerrar aviso"
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom bar */}
      <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[10px] text-neutral-500">
        <span className="font-mono">COORDS: {coords}</span>
        <span>
          Source: {terrainSource === "lola" ? "LOLA DEM + JPL Horizons" : "Relieve provisional + JPL Horizons"}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const status = useMissionStore((s) => s.status);
  const error = useMissionStore((s) => s.error);
  const data = useMissionStore((s) => s.data);
  const compare = useMissionStore((s) => s.compare);
  const enteredApp = useMissionStore((s) => s.enteredApp);
  const missionStarted = useMissionStore((s) => s.missionStarted);
  const delayHours = useMissionStore((s) => s.delayHours);
  const siteId = useMissionStore((s) => s.siteId);
  const setData = useMissionStore((s) => s.setData);
  const setError = useMissionStore((s) => s.setError);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const timeline = await loadOrbitalTimeline("/data/orbital_data.json");
        let terrainSource: "lola" | "placeholder" = "lola";
        let terrain;
        let mask: Float32Array;
        let maskStep = 0.5;

        try {
          const loaded = await loadTerrain("/data/terrain.json");
          terrain = loaded.matrix;
          mask = loaded.mask;
          maskStep = loaded.file.horizon.step_deg;
        } catch {
          terrainSource = "placeholder";
          terrain = buildPlaceholderTerrain();
          mask = buildHorizonMask(terrain, maskStep, { observerHeight: 2 });
        }

        const contextTerrain = await loadTerrainContext("/data/terrain_context.json");
        const vis = computeVisibility(timeline, mask, maskStep);
        const delaySteps = Math.round((48 * 3.6e6) / timeline.stepMs);
        const firstCrisis = findNextCrisis(vis, 0, delaySteps);
        const startMs = firstCrisis >= 0 ? timeline.t0Ms + firstCrisis * timeline.stepMs : timeline.t0Ms;

        if (!cancelled) {
          setData({ timeline, terrain, contextTerrain, mask, maskStep, vis, terrainSource }, startMs);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error cargando datos de misión");
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [setData, setError]);

  const site = SITES.find((s) => s.id === siteId) ?? SITES[0];
  const coords = site.lat !== undefined && site.lon !== undefined ? formatCoord(site.lat, site.lon) : "—";

  if (!enteredApp) {
    return <LandingPage />;
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#0f0f0f] text-neutral-100 lg:h-dvh lg:overflow-hidden">
      <MissionHeader />
      {missionStarted && <TimelineBar />}

      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center font-mono text-xs tracking-widest text-neutral-400">
          CARGANDO EFEMÉRIDES JPL Y MOTOR DE OCLUSIÓN...
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-1 items-center justify-center p-6 text-center font-mono text-xs text-rose-400">
          Error inicializando simulación: {error}
        </div>
      )}

      {status === "ready" && data && !missionStarted && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex h-[50vh] min-h-[300px] p-2 sm:p-3 lg:h-auto lg:min-h-0 lg:flex-1">
            <ViewportCard
              title={`SELECCIÓN DE SITIO DE ATERRIZAJE (${site.name}) — HAZ CLIC EN EL CRÁTER`}
              coords={coords}
              offsetHours={0}
              terrainSource={data.terrainSource}
            />
          </div>
          <MissionSetupPanel />
        </div>
      )}

      {status === "ready" && data && missionStarted && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <SiteSidebar />

          {/* Center workspace */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-2.5 sm:p-3 lg:flex-row">
            {compare ? (
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex min-h-0 flex-col gap-2.5">
                  <ViewportCard
                    title={`VISUALIZACIÓN DEL HORIZONTE (${site.name} · T+0H NOMINAL)`}
                    coords={coords}
                    offsetHours={0}
                    terrainSource={data.terrainSource}
                  />
                  <CompactMetricsCard offsetHours={0} />
                </div>

                <div className="flex min-h-0 flex-col gap-2.5">
                  <ViewportCard
                    title={`VISUALIZACIÓN DEL HORIZONTE (${site.name} · RETRASO +${delayHours}H)`}
                    coords={coords}
                    offsetHours={delayHours}
                    terrainSource={data.terrainSource}
                  />
                  <CompactMetricsCard offsetHours={delayHours} />
                </div>
              </div>
            ) : (
              <ViewportCard
                title={`VISUALIZACIÓN DEL HORIZONTE LOCAL (${site.name})`}
                coords={coords}
                offsetHours={0}
                ghostOffsetHours={delayHours}
                terrainSource={data.terrainSource}
              />
            )}

            {/* Right operational column */}
            <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-64 lg:overflow-y-auto">
              {!compare && <DetailedMetricsCards offsetHours={0} />}
              <OperationalAlert />
            </aside>
          </div>
        </div>
      )}
    </main>
  );
}
