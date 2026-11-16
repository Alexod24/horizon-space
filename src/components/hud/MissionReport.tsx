"use client";

import { useMemo } from "react";
import { calculateMissionViability, indexAt } from "@/lib/engine/timeline";
import { formatCoord, formatDate, formatShortDay } from "@/lib/scene";
import { SITES } from "@/lib/sites";
import { findVehicle } from "@/lib/vehicles";
import { TRANSIT_PROFILES, useMissionStore } from "@/store/useMissionStore";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MISSION_DAYS = 7;
const MISSION_HOURS = MISSION_DAYS * 24;

interface DayBreakdown {
  day: number;
  dateStr: string;
  sunPct: number;
  earthPct: number;
  sunOk: boolean;
  earthOk: boolean;
}

export function MissionReportCard() {
  const data = useMissionStore((s) => s.data);
  const reportReady = useMissionStore((s) => s.reportReady);
  const plannedLaunchMs = useMissionStore((s) => s.plannedLaunchMs);
  const transitDays = useMissionStore((s) => s.transitDays);
  const delayHours = useMissionStore((s) => s.delayHours);
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const landingSite = useMissionStore((s) => s.landingSite);
  const lang = useMissionStore((s) => s.lang);
  const setReportModalOpen = useMissionStore((s) => s.setReportModalOpen);
  const setReportReady = useMissionStore((s) => s.setReportReady);
  const en = lang === "en";
  const veh = findVehicle(vehicleId);

  const viability = useMemo(() => {
    if (!data) return null;
    return calculateMissionViability(
      data.timeline,
      data.vis,
      plannedLaunchMs,
      transitDays,
      delayHours,
      veh.maxDarkHours,
      MISSION_DAYS,
    );
  }, [data, plannedLaunchMs, transitDays, delayHours, veh.maxDarkHours]);

  if (!reportReady || !data || !viability) return null;

  const touchdownMs = plannedLaunchMs + transitDays * DAY_MS;
  const endSurfaceMs = touchdownMs + MISSION_DAYS * DAY_MS;
  const sunHours = Math.round((viability.solarPct / 100) * MISSION_HOURS);
  const earthHours = Math.round((viability.earthPct / 100) * MISSION_HOURS);
  const darkHours = MISSION_HOURS - sunHours;
  const batterySurvived = !viability.delayThermalFreeze && darkHours <= veh.maxDarkHours;

  const statusConfig =
    viability.tier === "OPTIMAL"
      ? {
          badge: en ? "SUCCESSFUL MISSION" : "MISIÓN EXITOSA",
          badgeClass: "border-emerald-400/60 bg-emerald-950/70 text-emerald-300",
          borderClass: "border-emerald-500/60 bg-emerald-950/15",
          scoreColor: "text-emerald-400",
        }
      : viability.tier === "MARGINAL"
        ? {
            badge: en ? "PARTIAL RISK" : "RIESGO PARCIAL",
            badgeClass: "border-amber-400/60 bg-amber-950/70 text-amber-300",
            borderClass: "border-amber-500/60 bg-amber-950/15",
            scoreColor: "text-amber-300",
          }
        : {
            badge: en ? "CRITICAL / FAILED" : "MISIÓN CRÍTICA",
            badgeClass: "border-rose-500/60 bg-rose-950/70 text-rose-300",
            borderClass: "border-rose-500/60 bg-rose-950/20",
            scoreColor: "text-rose-400",
          };

  return (
    <div
      id="mission-report-card"
      className={`rounded-md border-2 p-3 text-xs shadow-lg transition-all ${statusConfig.borderClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-emerald-300">
              {en ? "7-DAY MISSION REPORT" : "INFORME DE MISIÓN (7 DÍAS)"}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-300">
            {formatShortDay(touchdownMs, lang)} ➔ {formatShortDay(endSurfaceMs, lang)} (168 h)
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReportReady(false)}
          aria-label={en ? "Dismiss report card" : "Ocultar resumen"}
          className="text-neutral-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded border border-neutral-800 bg-[#121212] px-2.5 py-2">
        <div>
          <span
            className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${statusConfig.badgeClass}`}
          >
            {statusConfig.badge}
          </span>
          <div className="mt-1 text-[10px] text-neutral-400">
            {veh.name} · ({landingSite.x.toFixed(1)}, {landingSite.y.toFixed(1)} km)
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-lg font-bold ${statusConfig.scoreColor}`}>
            {viability.score.toFixed(1)}%
          </div>
          <div className="font-mono text-[9px] text-neutral-500">
            {en ? "Global Score" : "Viabilidad 7d"}
          </div>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 rounded border border-neutral-800/90 bg-[#121212] p-2.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <img src="/sun.jpg" alt="Sol" className="h-4 w-4 rounded-full object-cover" />
            <span>{en ? "Solar Light (7d):" : "Luz Solar (7d):"}</span>
          </span>
          <span className="font-mono text-[10px] font-bold text-white">
            {sunHours}h / 168h{" "}
            <span className={viability.solarPct >= 95 ? "text-emerald-400" : "text-amber-300"}>
              ({viability.solarPct.toFixed(0)}%)
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <img src="/earth.jpg" alt="Tierra" className="h-4 w-4 rounded-full object-cover" />
            <span>{en ? "Earth Signal (7d):" : "Señal Tierra (7d):"}</span>
          </span>
          <span className="font-mono text-[10px] font-bold text-white">
            {earthHours}h / 168h{" "}
            <span className={viability.earthPct >= 95 ? "text-emerald-400" : "text-amber-300"}>
              ({viability.earthPct.toFixed(0)}%)
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5">
          <span className="text-neutral-400">{en ? "Thermal Battery:" : "Batería Térmica:"}</span>
          <span
            className={`font-mono text-[10px] font-semibold ${
              batterySurvived ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {batterySurvived
              ? en
                ? `✓ Safe (limit ${veh.maxDarkHours}h)`
                : `✓ Intacta (lím. ${veh.maxDarkHours}h)`
              : en
                ? `✕ Exceeded ${veh.maxDarkHours}h`
                : `✕ Superó ${veh.maxDarkHours}h`}
          </span>
        </div>

        {delayHours > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5">
            <span className="text-neutral-400">
              {en ? `With +${delayHours}h delay:` : `Con retraso (+${delayHours}h):`}
            </span>
            <span
              className={`font-mono text-[10px] font-semibold ${
                viability.delayThermalFreeze
                  ? "text-rose-400"
                  : viability.delayOccluded
                    ? "text-amber-300"
                    : "text-emerald-400"
              }`}
            >
              {viability.delayThermalFreeze
                ? en
                  ? "✕ Thermal freeze"
                  : "✕ Apagón térmico"
                : `${viability.delayResiliencePct.toFixed(0)}% ${en ? "viable" : "viable"}`}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setReportModalOpen(true)}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded border border-emerald-400/70 bg-emerald-500 px-3 py-2 text-[11px] font-bold text-black transition hover:bg-emerald-400"
      >
        <span>📄</span>
        <span>{en ? "View Full Report & Print" : "Ver Informe Completo / Imprimir"}</span>
      </button>
    </div>
  );
}

export function MissionReportModal() {
  const data = useMissionStore((s) => s.data);
  const reportModalOpen = useMissionStore((s) => s.reportModalOpen);
  const setReportModalOpen = useMissionStore((s) => s.setReportModalOpen);
  const plannedLaunchMs = useMissionStore((s) => s.plannedLaunchMs);
  const transitDays = useMissionStore((s) => s.transitDays);
  const delayHours = useMissionStore((s) => s.delayHours);
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const siteId = useMissionStore((s) => s.siteId);
  const landingSite = useMissionStore((s) => s.landingSite);
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";
  const veh = findVehicle(vehicleId);
  const site = SITES.find((s) => s.id === siteId) ?? SITES[0];
  const transitProfile =
    TRANSIT_PROFILES.find((tp) => tp.days === transitDays) ?? TRANSIT_PROFILES[0];

  const viability = useMemo(() => {
    if (!data) return null;
    return calculateMissionViability(
      data.timeline,
      data.vis,
      plannedLaunchMs,
      transitDays,
      delayHours,
      veh.maxDarkHours,
      MISSION_DAYS,
    );
  }, [data, plannedLaunchMs, transitDays, delayHours, veh.maxDarkHours]);

  const dailyBreakdown = useMemo<DayBreakdown[]>(() => {
    if (!data) return [];
    const { timeline, vis } = data;
    const touchdownMs = plannedLaunchMs + transitDays * DAY_MS;
    const stepsPerDay = Math.max(1, Math.round(DAY_MS / timeline.stepMs));
    const days: DayBreakdown[] = [];

    for (let d = 0; d < MISSION_DAYS; d++) {
      const dayStartMs = touchdownMs + d * DAY_MS;
      const startIdx = indexAt(timeline, dayStartMs);
      const endIdx = Math.min(vis.n - 1, startIdx + stepsPerDay);
      const count = Math.max(1, endIdx - startIdx);
      let sunSteps = 0;
      let earthSteps = 0;
      for (let i = startIdx; i < endIdx; i++) {
        if (vis.sunVis[i] === 1) sunSteps++;
        if (vis.earthVis[i] === 1) earthSteps++;
      }
      const sunPct = Math.round((sunSteps / count) * 100);
      const earthPct = Math.round((earthSteps / count) * 100);
      days.push({
        day: d + 1,
        dateStr: formatShortDay(dayStartMs, lang),
        sunPct,
        earthPct,
        sunOk: sunPct >= 80,
        earthOk: earthPct >= 80,
      });
    }
    return days;
  }, [data, plannedLaunchMs, transitDays, lang]);

  if (!reportModalOpen || !data || !viability) return null;

  const touchdownMs = plannedLaunchMs + transitDays * DAY_MS;
  const endSurfaceMs = touchdownMs + MISSION_DAYS * DAY_MS;
  const sunHours = Math.round((viability.solarPct / 100) * MISSION_HOURS);
  const earthHours = Math.round((viability.earthPct / 100) * MISSION_HOURS);
  const coords =
    site.lat !== undefined && site.lon !== undefined ? formatCoord(site.lat, site.lon) : "89.9°S";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-700 bg-[#141414] p-5 text-xs text-neutral-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-3">
          <div>
            <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-emerald-400">
              {en
                ? "HORIZON SPACE · POST-MISSION TECHNICAL & EDUCATIONAL REPORT"
                : "HORIZON SPACE · INFORME FINAL DE SIMULACIÓN LUNAR (7 DÍAS)"}
            </div>
            <h2 className="mt-1 text-lg font-bold text-white">
              {en
                ? `Mission Summary: ${site.name} (${veh.name})`
                : `Resumen de Misión: ${site.name} (${veh.name})`}
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              {en
                ? "Evaluation of the 7 guaranteed surface days (168 hours) using NASA LOLA DEM & JPL Horizons ephemerides."
                : "Evaluación de los 7 días asegurados en superficie (168 horas) con topografía NASA LOLA DEM y efemérides JPL Horizons."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportModalOpen(false)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
            <div className="text-[10px] font-semibold tracking-wider text-neutral-400">
              {en ? "OVERALL VIABILITY" : "VIABILIDAD GLOBAL (7D)"}
            </div>
            <div
              className={`mt-1 font-mono text-2xl font-bold ${
                viability.tier === "OPTIMAL"
                  ? "text-emerald-400"
                  : viability.tier === "MARGINAL"
                    ? "text-amber-300"
                    : "text-rose-400"
              }`}
            >
              {viability.score.toFixed(1)}%
            </div>
            <div className="mt-0.5 text-[10px] text-neutral-400">
              {viability.tier === "OPTIMAL"
                ? en
                  ? "✓ Optimal 7-day window"
                  : "✓ Ventana óptima de 7 días"
                : viability.tier === "MARGINAL"
                  ? en
                    ? "⚠ Marginal window with partial shadow"
                    : "⚠ Ventana marginal con sombra parcial"
                  : en
                    ? "✕ High risk of occlusion / freeze"
                    : "✕ Riesgo crítico de sombra o bloqueo"}
            </div>
          </div>

          <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-neutral-400">
              <img src="/sun.jpg" alt="Sol" className="h-4 w-4 rounded-full object-cover" />
              <span>{en ? "SOLAR ENERGY (168H)" : "LUZ SOLAR (168H)"}</span>
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-white">
              {sunHours}h <span className="text-sm font-normal text-neutral-400">/ 168h</span>
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-400">
              {viability.solarPct.toFixed(1)}%{" "}
              {en ? "surface illumination" : "de iluminación en el sitio"}
            </div>
          </div>

          <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-neutral-400">
              <img src="/earth.jpg" alt="Tierra" className="h-4 w-4 rounded-full object-cover" />
              <span>{en ? "EARTH DIRECT LINK" : "ENLACE TIERRA (168H)"}</span>
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-white">
              {earthHours}h <span className="text-sm font-normal text-neutral-400">/ 168h</span>
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-400">
              {viability.earthPct.toFixed(1)}%{" "}
              {en ? "direct line-of-sight" : "de contacto directo sin bloqueo"}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
          <div className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-neutral-400">
            {en ? "MISSION PARAMETERS" : "PARÁMETROS DE LA MISIÓN SIMULADA"}
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div>
              <div className="text-[10px] text-neutral-500">{en ? "Launch (T-0 UTC)" : "Lanzamiento (T-0 UTC)"}</div>
              <div className="font-mono font-semibold text-white">{formatDate(plannedLaunchMs, lang)}</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">{en ? "Lunar Touchdown" : "Alunizaje Nominal"}</div>
              <div className="font-mono font-semibold text-emerald-400">{formatDate(touchdownMs, lang)}</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">{en ? "End of 7d Window" : "Fin de 7 Días Asegurados"}</div>
              <div className="font-mono font-semibold text-white">{formatDate(endSurfaceMs, lang)}</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">{en ? "Landing Coordinates" : "Coordenadas en Cráter"}</div>
              <div className="font-mono font-semibold text-white">
                X: {landingSite.x.toFixed(2)} km, Y: {landingSite.y.toFixed(2)} km ({landingSite.elevationM.toFixed(0)} m)
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">{en ? "Lander / Equipment" : "Módulo / Equipo"}</div>
              <div className="font-mono font-semibold text-white">
                {veh.name} ({veh.heightM}m · {veh.maxDarkHours}h bat.)
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">{en ? "Transit & Delay" : "Tránsito y Retraso"}</div>
              <div className="font-mono font-semibold text-white">
                {en ? transitProfile.labelEn : transitProfile.labelEs} · +{delayHours}h ({coords})
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-neutral-800 bg-[#1a1a1a] p-3">
          <div className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-neutral-400">
            {en
              ? "DAY-BY-DAY SURFACE LOG (7 GUARANTEED DAYS)"
              : "BITÁCORA DÍA POR DÍA EN LA LUNA (7 DÍAS ASEGURADOS)"}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {dailyBreakdown.map((d) => (
              <div
                key={d.day}
                className="flex flex-col items-center rounded border border-neutral-800 bg-[#121212] p-2 text-center"
              >
                <span className="font-mono text-[10px] font-bold text-white">
                  {en ? `Day ${d.day}` : `Día ${d.day}`}
                </span>
                <span className="text-[9px] text-neutral-500">{d.dateStr}</span>
                <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px]">
                  <img src="/sun.jpg" alt="Sol" className="h-3.5 w-3.5 rounded-full object-cover" />
                  <span className={d.sunOk ? "text-emerald-400" : "text-rose-400"}>{d.sunPct}%</span>
                </div>
                <div className="mt-1 flex items-center gap-1 font-mono text-[10px]">
                  <img src="/earth.jpg" alt="Tierra" className="h-3.5 w-3.5 rounded-full object-cover" />
                  <span className={d.earthOk ? "text-emerald-400" : "text-rose-400"}>{d.earthPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-md border border-neutral-800 bg-[#121212] p-3 text-[11px] leading-relaxed text-neutral-300">
          <strong className="text-white">
            {en ? "Why does the guaranteed window last 7 days? " : "¿Por qué la ventana asegurada dura 7 días? "}
          </strong>
          {en
            ? "At the Lunar South Pole, the Sun skims the horizon at less than 1.5° elevation over a ~29.5-day synodic cycle. Landing at the start of an illuminated crest guarantees 168 hours of continuous solar power and Earth communication before neighbouring crater ridges cast multi-day polar shadows."
            : "En el Polo Sur Lunar, el Sol roza el horizonte a menos de 1.5° de elevación durante un ciclo sinódico de ~29.5 días. Aterrizar al inicio de una ventana óptima garantiza 168 horas de energía solar y enlace con la Tierra antes de que las crestas del cráter Shackleton proyecten sombras polares que superarían las baterías del módulo."}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-neutral-800 pt-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
          >
            🖨 {en ? "Print / Save PDF" : "Imprimir / Guardar PDF"}
          </button>
          <button
            type="button"
            onClick={() => setReportModalOpen(false)}
            className="rounded bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-400"
          >
            {en ? "Done" : "Cerrar Informe"}
          </button>
        </div>
      </div>
    </div>
  );
}
