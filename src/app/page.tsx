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
import { formatCoord, formatShortDay } from "@/lib/scene";
import { LUNAR_LANDMARKS } from "@/lib/landmarks";
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
  const timeMs = useMissionStore((s) => s.timeMs);
  const transitDays = useMissionStore((s) => s.transitDays);
  const outOfBoundsKm = useMissionStore((s) => s.outOfBoundsKm);
  const setOutOfBoundsKm = useMissionStore((s) => s.setOutOfBoundsKm);
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const setIsolatePole = useMissionStore((s) => s.setIsolatePole);
  const terrainBrightness = useMissionStore((s) => s.terrainBrightness);
  const setTerrainBrightness = useMissionStore((s) => s.setTerrainBrightness);
  const selectedLandmarkId = useMissionStore((s) => s.selectedLandmarkId);
  const setSelectedLandmarkId = useMissionStore((s) => s.setSelectedLandmarkId);
  const missionStarted = useMissionStore((s) => s.missionStarted);
  const advancedHud = useMissionStore((s) => s.advancedHud);
  const triggerCenter = useMissionStore((s) => s.triggerCenter);
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";
  const selectedLandmark = LUNAR_LANDMARKS.find((l) => l.id === selectedLandmarkId) ?? null;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  const launchMs = timeMs + offsetHours * 3_600_000;
  const touchdownMs = launchMs + transitDays * 86_400_000;
  const launchStr = formatShortDay(launchMs, lang);
  const touchdownStr = formatShortDay(touchdownMs, lang);
  const isDelayed = offsetHours > 0;

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
          <div className="mt-0.5 font-mono text-[9px] sm:text-[10px]">
            <span className="text-neutral-400">
              {en ? "LAUNCH:" : "LANZAMIENTO:"}{" "}
              <strong className="text-neutral-200">{launchStr}</strong>
              {isDelayed ? ` (+${offsetHours}H)` : ""}
            </span>{" "}
            <span className="text-neutral-500">➔</span>{" "}
            <span className={isDelayed ? "text-amber-300" : "text-emerald-400"}>
              {en ? "LUNAR TOUCHDOWN:" : "ALUNIZAJE:"}{" "}
              <strong>{touchdownStr}</strong>{" "}
              <span className="text-neutral-400">
                ({isDelayed ? (en ? "CRISIS" : "CRISIS") : "NOMINAL"} · +{transitDays}D)
              </span>
            </span>
          </div>
          {(!missionStarted || advancedHud) && (
            <div className="font-mono text-[9px] text-neutral-500 sm:text-[10px]">
              COORDS: {coords} · {en ? "DOME" : "CÚPULA"} R = 15 KM
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          {!missionStarted && (
            <>
              <div
                title={en ? "Adjust lunar terrain brightness" : "Ajustar brillo del terreno lunar"}
                className="flex h-7 items-center gap-1.5 rounded border border-neutral-700 bg-[#141414]/85 px-2 text-[10px] text-neutral-300 backdrop-blur-sm"
              >
                <span aria-hidden="true" className="text-neutral-400">☀</span>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={terrainBrightness}
                  onChange={(e) => setTerrainBrightness(parseFloat(e.target.value))}
                  aria-label={en ? "Lunar terrain brightness" : "Brillo del terreno lunar"}
                  className="horizon-range w-14 sm:w-20"
                  style={{ "--pct": `${((terrainBrightness - 0.5) / 2.5) * 100}%` } as React.CSSProperties}
                />
                <span className="w-6 text-right font-mono text-[9px] text-neutral-400">
                  {Math.round(terrainBrightness * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsolatePole(!isolatePole)}
                title={
                  isolatePole
                    ? en ? "Switch to full map (±80 km)" : "Cambiar a mapa completo (±80 km)"
                    : en ? "Show South Pole only (15 km)" : "Mostrar solo Polo Sur (15 km)"
                }
                className={`flex h-7 items-center gap-1 rounded border px-2 text-[10px] font-medium backdrop-blur-sm transition sm:px-2.5 ${
                  isolatePole
                    ? "border-neutral-600 bg-neutral-800/90 text-white"
                    : "border-neutral-700 bg-[#141414]/85 text-neutral-300 hover:border-neutral-500 hover:text-white"
                }`}
              >
                {isolatePole ? (en ? "South Pole Only" : "Solo Polo Sur") : (en ? "Full Map" : "Mapa Completo")}
              </button>

              <button
                type="button"
                onClick={triggerCenter}
                title={en ? "Center camera on landing site" : "Centrar cámara en el sitio de aterrizaje"}
                aria-label={en ? "Center camera on landing site" : "Centrar cámara en el sitio de aterrizaje"}
                className="flex h-7 items-center gap-1 rounded border border-neutral-700 bg-[#141414]/85 px-2 text-[10px] font-medium text-neutral-200 backdrop-blur-sm transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white sm:px-2.5"
              >
                <span aria-hidden="true">⌖</span>
                <span>{en ? "Center" : "Centrar"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFs ? (en ? "Exit fullscreen" : "Salir de pantalla completa") : (en ? "View fullscreen" : "Ver en pantalla completa")}
            aria-label={isFs ? (en ? "Exit fullscreen" : "Salir de pantalla completa") : (en ? "View fullscreen" : "Ver en pantalla completa")}
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
              {en
                ? `⚠ Outside South Pole zone (${outOfBoundsKm} km > 15 km)`
                : `⚠ Fuera de zona Polo Sur (${outOfBoundsKm} km > 15 km)`}
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-neutral-400">
              {en
                ? "Occlusion and ephemeris analysis applies within the 15 km dome radius. Click inside the perimeter to return."
                : "El análisis de oclusión y efemérides aplica dentro del radio de 15 km de la cúpula. Haz clic dentro del perímetro para volver."}
            </p>
          </div>
          <button
            onClick={() => setOutOfBoundsKm(null)}
            aria-label={en ? "Close alert" : "Cerrar aviso"}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Educational landmark popover in Phase 1 only (in Phase 2 it renders in the right operational column) */}
      {!missionStarted && selectedLandmark && (
        <div className="absolute bottom-9 left-3 z-20 w-72 max-w-[calc(100%-1.5rem)] rounded-md border border-neutral-700 bg-[#141414]/95 p-3 text-xs text-neutral-100 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white text-[11px] font-bold text-black">
                ?
              </span>
              <div>
                <div className="font-semibold leading-tight text-white">
                  {en ? selectedLandmark.nameEn : selectedLandmark.name}
                </div>
                <div className="font-mono text-[9px] text-neutral-400">
                  {en ? selectedLandmark.subtitleEn : selectedLandmark.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLandmarkId(null)}
              aria-label={en ? "Close info" : "Cerrar información"}
              className="text-neutral-400 transition hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-300">
            {en ? selectedLandmark.descEn : selectedLandmark.desc}
          </p>
          <div className="mt-2 rounded border border-neutral-800 bg-[#1b1b1e] px-2 py-1.5 text-[10px] text-neutral-300">
            <span className="font-mono font-semibold text-white">{en ? "FACT: " : "DATO: "}</span>
            {en ? selectedLandmark.factEn : selectedLandmark.fact}
          </div>
        </div>
      )}

      {/* Bottom bar (shown in Phase 1 or when Advanced Options are active) */}
      {(!missionStarted || advancedHud) && (
        <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[10px] text-neutral-500">
          <span className="font-mono">COORDS: {coords}</span>
          <span>
            Source: {terrainSource === "lola" ? "LOLA DEM + JPL Horizons" : en ? "Placeholder relief + JPL Horizons" : "Relieve provisional + JPL Horizons"}
          </span>
        </div>
      )}
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
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";
  const selectedLandmarkId = useMissionStore((s) => s.selectedLandmarkId);
  const setSelectedLandmarkId = useMissionStore((s) => s.setSelectedLandmarkId);
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const setIsolatePole = useMissionStore((s) => s.setIsolatePole);
  const terrainBrightness = useMissionStore((s) => s.terrainBrightness);
  const setTerrainBrightness = useMissionStore((s) => s.setTerrainBrightness);
  const triggerCenter = useMissionStore((s) => s.triggerCenter);
  const selectedLandmark = LUNAR_LANDMARKS.find((l) => l.id === selectedLandmarkId) ?? null;
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
        const defaultTransitMs = 7 * 86_400_000;
        const minTouchdownIdx = Math.ceil(defaultTransitMs / timeline.stepMs);
        const delaySteps = Math.round((48 * 3.6e6) / timeline.stepMs);
        const firstCrisis = findNextCrisis(vis, minTouchdownIdx, delaySteps);
        const startMs =
          firstCrisis >= minTouchdownIdx
            ? timeline.t0Ms + firstCrisis * timeline.stepMs - defaultTransitMs
            : timeline.t0Ms;

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
          {en ? "LOADING JPL EPHEMERIS & OCCLUSION ENGINE..." : "CARGANDO EFEMÉRIDES JPL Y MOTOR DE OCLUSIÓN..."}
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-1 items-center justify-center p-6 text-center font-mono text-xs text-rose-400">
          {en ? "Error initializing simulation:" : "Error inicializando simulación:"} {error}
        </div>
      )}

      {status === "ready" && data && !missionStarted && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex h-[50vh] min-h-[300px] p-2 sm:p-3 lg:h-auto lg:min-h-0 lg:flex-1">
            <ViewportCard
              title={
                en
                  ? `LANDING SITE SELECTION (${site.name}) — CLICK ON THE CRATER`
                  : `SELECCIÓN DE SITIO DE ATERRIZAJE (${site.name}) — HAZ CLIC EN EL CRÁTER`
              }
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
                    title={
                      en
                        ? `HORIZON VIEW (${site.name} · T+0H NOMINAL)`
                        : `VISUALIZACIÓN DEL HORIZONTE (${site.name} · T+0H NOMINAL)`
                    }
                    coords={coords}
                    offsetHours={0}
                    terrainSource={data.terrainSource}
                  />
                  <CompactMetricsCard offsetHours={0} />
                </div>

                <div className="flex min-h-0 flex-col gap-2.5">
                  <ViewportCard
                    title={
                      en
                        ? `HORIZON VIEW (${site.name} · DELAY +${delayHours}H)`
                        : `VISUALIZACIÓN DEL HORIZONTE (${site.name} · RETRASO +${delayHours}H)`
                    }
                    coords={coords}
                    offsetHours={delayHours}
                    terrainSource={data.terrainSource}
                  />
                  <CompactMetricsCard offsetHours={delayHours} />
                </div>
              </div>
            ) : (
              <ViewportCard
                title={
                  en
                    ? `LOCAL HORIZON VIEW (${site.name})`
                    : `VISUALIZACIÓN DEL HORIZONTE LOCAL (${site.name})`
                }
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

              {/* Shared 3D View Controls (moved out of viewports in Phase 2) */}
              <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
                <div className="mb-2.5 text-[10px] font-semibold tracking-[0.14em] text-neutral-400">
                  {en ? "VIEW CONTROLS" : "CONTROLES DE VISTA"}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>☀ {en ? "Terrain brightness" : "Brillo del terreno"}</span>
                      <span className="font-mono text-[10px] text-white">
                        {Math.round(terrainBrightness * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={terrainBrightness}
                      onChange={(e) => setTerrainBrightness(parseFloat(e.target.value))}
                      aria-label={en ? "Lunar terrain brightness" : "Brillo del terreno lunar"}
                      className="horizon-range w-full"
                      style={{ "--pct": `${((terrainBrightness - 0.5) / 2.5) * 100}%` } as React.CSSProperties}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsolatePole(!isolatePole)}
                      className={`rounded border px-2 py-1.5 text-[10px] font-medium transition ${
                        isolatePole
                          ? "border-white bg-white font-semibold text-black"
                          : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500"
                      }`}
                    >
                      {isolatePole ? (en ? "South Pole Only" : "Solo Polo Sur") : (en ? "Full Map" : "Mapa Completo")}
                    </button>

                    <button
                      type="button"
                      onClick={triggerCenter}
                      className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-[10px] font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
                    >
                      ⌖ {en ? "Center Site" : "Centrar Sitio"}
                    </button>
                  </div>
                </div>
              </div>

              {selectedLandmark && (
                <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs text-neutral-100">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400">
                      {en ? "ZONE INFO" : "INFO DE ZONA"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLandmarkId(null)}
                      aria-label={en ? "Close info" : "Cerrar información"}
                      className="text-neutral-400 transition hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white text-[11px] font-bold text-black">
                      ?
                    </span>
                    <div>
                      <div className="font-semibold leading-tight text-white">
                        {en ? selectedLandmark.nameEn : selectedLandmark.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-neutral-400">
                        {en ? selectedLandmark.subtitleEn : selectedLandmark.subtitle}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-neutral-300">
                    {en ? selectedLandmark.descEn : selectedLandmark.desc}
                  </p>
                  <div className="mt-2 rounded border border-neutral-800 bg-[#1b1b1e] px-2 py-1.5 text-[10px] text-neutral-300">
                    <span className="font-mono font-semibold text-white">{en ? "FACT: " : "DATO: "}</span>
                    {en ? selectedLandmark.factEn : selectedLandmark.fact}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </main>
  );
}
