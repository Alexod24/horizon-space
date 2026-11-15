"use client";

import { useMemo } from "react";
import { calculateMissionViability } from "@/lib/engine/timeline";
import { formatShortDay } from "@/lib/scene";
import { useScenario } from "@/lib/useScenario";
import { findVehicle } from "@/lib/vehicles";
import { useMissionStore } from "@/store/useMissionStore";

export function ViabilityVerdictCard() {
  const data = useMissionStore((s) => s.data);
  const plannedLaunchMs = useMissionStore((s) => s.plannedLaunchMs);
  const transitDays = useMissionStore((s) => s.transitDays);
  const delayHours = useMissionStore((s) => s.delayHours);
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const lang = useMissionStore((s) => s.lang);
  const setTime = useMissionStore((s) => s.setTime);
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
      7,
    );
  }, [data, plannedLaunchMs, transitDays, delayHours, veh.maxDarkHours]);

  if (!viability) return null;

  const tierBadge =
    viability.tier === "OPTIMAL"
      ? {
          label: en ? "OPTIMAL" : "ÓPTIMO",
          color: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300",
          scoreColor: "text-emerald-400",
          barColor: "#3ee08f",
        }
      : viability.tier === "MARGINAL"
        ? {
            label: "MARGINAL",
            color: "border-amber-500/50 bg-amber-950/40 text-amber-300",
            scoreColor: "text-amber-300",
            barColor: "#fbbf24",
          }
        : {
            label: en ? "CRITICAL" : "CRÍTICO",
            color: "border-rose-500/60 bg-rose-950/40 text-rose-300",
            scoreColor: "text-rose-400",
            barColor: "#ff3b4e",
          };

  const solarDetail =
    viability.solarPct >= 99.5
      ? en
        ? "Continuous light (7d)"
        : "Luz continua (7d)"
      : viability.firstSolarDropHours === 0
        ? en
          ? "Touchdown in shadow"
          : "Alunizaje en sombra"
        : viability.firstSolarDropHours !== null
          ? en
            ? `Occlusion in +${viability.firstSolarDropHours}h`
            : `Oclusión en +${viability.firstSolarDropHours}h`
          : en
            ? "Partial occlusion"
            : "Oclusión parcial";

  const earthDetail =
    viability.earthPct >= 95
      ? en
        ? "Stable link"
        : "Enlace estable"
      : viability.earthPct >= 70
        ? en
          ? "Intermittent LOS"
          : "Enlace intermitente"
        : en
          ? "Severe terrain block"
          : "Bloqueo severo";

  const resilienceDetail = viability.delayThermalFreeze
    ? en
      ? `❌ CRITICAL (Thermal freeze >${veh.maxDarkHours}h)`
      : `❌ CRÍTICO (Apagón térmico >${veh.maxDarkHours}h)`
    : viability.delayOccluded
      ? en
        ? `⚠ Occluded at +${delayHours}h touchdown`
        : `⚠ Oclusión al aterrizar (+${delayHours}h)`
      : en
        ? `✓ Resilient (${viability.delayResiliencePct.toFixed(0)}%)`
        : `✓ Resiliente (${viability.delayResiliencePct.toFixed(0)}%)`;

  const opt = viability.optimal;
  const deltaSign = opt && opt.deltaDays >= 0 ? "+" : "";

  return (
    <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold tracking-[0.12em] text-neutral-400">
          {en ? "MISSION VIABILITY (7D)" : "VIABILIDAD DE MISIÓN (7D)"}
        </span>
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${tierBadge.color}`}>
          {tierBadge.label}
        </span>
      </div>

      {/* Main Score + Bar */}
      <div className="mt-1.5 flex items-baseline justify-between">
        <div className={`font-mono text-xl font-bold ${tierBadge.scoreColor}`}>
          {viability.score.toFixed(1)}%
        </div>
        <div className="font-mono text-[10px] text-neutral-500">
          50% Sol · 30% Com · 20% +{delayHours}h
        </div>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${Math.max(4, Math.min(100, viability.score))}%`,
            backgroundColor: tierBadge.barColor,
          }}
        />
      </div>

      {/* 3 Sub-metrics */}
      <div className="mt-2.5 space-y-1.5 border-t border-neutral-800/80 pt-2 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-400">{en ? "Solar Window:" : "Ventana Solar:"}</span>
          <span className="text-right font-mono text-[10px]">
            <strong className="text-white">{viability.solarPct.toFixed(0)}%</strong>{" "}
            <span className="text-neutral-500">({solarDetail})</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-400">{en ? "Earth LOS:" : "Enlace Tierra:"}</span>
          <span className="text-right font-mono text-[10px]">
            <strong className="text-white">{viability.earthPct.toFixed(0)}%</strong>{" "}
            <span className="text-neutral-500">({earthDetail})</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-400">
            {en ? `Delay (+${delayHours}h):` : `Resiliencia (+${delayHours}h):`}
          </span>
          <span
            className={`text-right font-mono text-[10px] font-semibold ${
              viability.delayThermalFreeze
                ? "text-rose-400"
                : viability.delayOccluded
                  ? "text-amber-300"
                  : "text-emerald-400"
            }`}
          >
            {resilienceDetail}
          </span>
        </div>
      </div>

      {/* 7-Day Guaranteed Window Explanation */}
      <div className="mt-2.5 rounded border border-neutral-800 bg-[#121212] px-2.5 py-2 text-[10px] leading-relaxed text-neutral-400">
        <strong className="text-neutral-200">
          {en ? "⏳ 7 Guaranteed Days (168 h): " : "⏳ 7 días asegurados (168 h): "}
        </strong>
        {en
          ? "This score guarantees solar light and Earth link during the first week after touchdown. Beyond 7 days, the ~29.5-day lunar cycle hides the Sun behind the crater rim and lunar night begins."
          : "Esta ventana asegura luz solar y señal durante la primera semana en la Luna. Pasados los 7 días, el ciclo lunar (~29.5 días) oculta el Sol tras el cráter y comienza la noche polar."}
      </div>

      {/* AI / System Recommendation Callout */}
      {opt && (
        <div className="mt-2.5 rounded border border-neutral-700 bg-[#111111] p-2.5">
          <div className="text-[9px] font-bold tracking-[0.12em] text-amber-300">
            {en ? "💡 SYSTEM RECOMMENDATION" : "💡 RECOMENDACIÓN DEL SISTEMA"}
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-300">
            {en ? (
              <>
                Shift launch to{" "}
                <strong className="font-mono text-white">{formatShortDay(opt.launchMs, lang)}</strong> (
                {deltaSign}
                {opt.deltaDays}d ➔ touchdown{" "}
                <strong className="font-mono text-white">{formatShortDay(opt.touchdownMs, lang)}</strong>) to
                raise viability to{" "}
                <strong className="font-mono text-emerald-400">{opt.score.toFixed(1)}%</strong>.
              </>
            ) : (
              <>
                Mover lanzamiento al{" "}
                <strong className="font-mono text-white">{formatShortDay(opt.launchMs, lang)}</strong> (
                {deltaSign}
                {opt.deltaDays}d ➔ alunizaje{" "}
                <strong className="font-mono text-white">{formatShortDay(opt.touchdownMs, lang)}</strong>)
                eleva la viabilidad al{" "}
                <strong className="font-mono text-emerald-400">{opt.score.toFixed(1)}%</strong>.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setTime(opt.launchMs)}
            className="mt-2 w-full rounded border border-emerald-500/60 bg-emerald-950/50 px-2 py-1.5 font-mono text-[10px] font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-900/60 hover:text-white"
          >
            {en
              ? `Apply Optimal Launch (${opt.score.toFixed(1)}%)`
              : `Aplicar Fecha Óptima (${opt.score.toFixed(1)}%)`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OperationalAlert() {
  const data = useMissionStore((s) => s.data);
  const plannedLaunchMs = useMissionStore((s) => s.plannedLaunchMs);
  const transitDays = useMissionStore((s) => s.transitDays);
  const delayHours = useMissionStore((s) => s.delayHours);
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const lang = useMissionStore((s) => s.lang);
  const advancedHud = useMissionStore((s) => s.advancedHud);
  const setAdvancedHud = useMissionStore((s) => s.setAdvancedHud);
  const setTime = useMissionStore((s) => s.setTime);
  const en = lang === "en";
  const veh = findVehicle(vehicleId);
  const nominal = useScenario(0);
  const crisis = useScenario(delayHours);

  const viability = useMemo(() => {
    if (!data) return null;
    return calculateMissionViability(
      data.timeline,
      data.vis,
      plannedLaunchMs,
      transitDays,
      delayHours,
      veh.maxDarkHours,
      7,
    );
  }, [data, plannedLaunchMs, transitDays, delayHours, veh.maxDarkHours]);

  if (!nominal || !crisis) return null;

  const nomSunOk = !nominal.occ.sun;
  const nomEarthOk = !nominal.occ.earth;
  const criSunOk = !crisis.occ.sun;
  const criEarthOk = !crisis.occ.earth;
  const nominalOk = nomSunOk && nomEarthOk;
  const crisisOk = criSunOk && criEarthOk;
  const crisisLostSun = nomSunOk && !criSunOk;
  const crisisLostEarth = nomEarthOk && !criEarthOk;
  const delayDegrades = crisisLostSun || crisisLostEarth;
  const bothBad = !nominalOk && !crisisOk;
  const crisisDarkH = crisis.occ.sun ? crisis.sunWindow.msToChange / 3.6e6 : 0;
  const freezes = crisis.occ.sun && crisisDarkH > veh.maxDarkHours;

  if (!advancedHud) {
    const simpleStatus =
      nominalOk && crisisOk
        ? {
            icon: "✓",
            badgeClass: "border-emerald-500/60 bg-emerald-950/60 text-emerald-400",
            boxClass: "border-emerald-500/40 bg-emerald-950/20",
            titleColor: "text-emerald-400",
            title: en ? "Mission Viable" : "Misión Viable",
            subtitle: en
              ? `Safe landing even with a +${delayHours}h delay.`
              : `Aterrizaje seguro incluso si el cohete se retrasa +${delayHours}h.`,
          }
        : nominalOk && !crisisOk
          ? {
              icon: "⚠",
              badgeClass: "border-amber-500/60 bg-amber-950/60 text-amber-300",
              boxClass: "border-rose-500/50 bg-rose-950/25",
              titleColor: "text-amber-300",
              title: en ? `Risk on +${delayHours}h Delay` : `Riesgo si se retrasa +${delayHours}h`,
              subtitle: en
                ? "On-time landing is safe, but a delay leaves the lander without sun or signal."
                : "A tiempo es seguro, pero un retraso deja la nave sin luz solar o sin señal.",
            }
          : {
              icon: "✕",
              badgeClass: "border-rose-500/60 bg-rose-950/60 text-rose-400",
              boxClass: "border-rose-500/50 bg-rose-950/25",
              titleColor: "text-rose-400",
              title: en ? "Not Viable" : "No Viable",
              subtitle: en
                ? "Landing site is blocked by crater shadows or has no Earth contact."
                : "El sitio está en sombra o sin contacto con la Tierra en esta fecha.",
            };

    const opt = viability?.optimal;

    return (
      <div className="space-y-2.5 text-xs">
        <div className={`rounded-md border p-3 ${simpleStatus.boxClass}`}>
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base font-bold ${simpleStatus.badgeClass}`}
            >
              {simpleStatus.icon}
            </span>
            <div>
              <div className={`text-sm font-bold ${simpleStatus.titleColor}`}>{simpleStatus.title}</div>
              <div className="text-[11px] leading-snug text-neutral-300">{simpleStatus.subtitle}</div>
            </div>
          </div>

          {/* Simple Sun & Earth Contact Rows with Real Photos */}
          <div className="mt-3 space-y-2 rounded border border-neutral-800/90 bg-[#121212] p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-neutral-300">
                {en ? "On time (Normal)" : "A tiempo (Normal)"}
              </span>
              <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold">
                <span className={`inline-flex items-center gap-1 ${nomSunOk ? "text-emerald-400" : "text-rose-400"}`}>
                  <img src="/sun.jpg" alt="Sol" className="h-4 w-4 rounded-full object-cover" />
                  {nomSunOk ? "✓" : "✕"}
                </span>
                <span className={`inline-flex items-center gap-1 ${nomEarthOk ? "text-emerald-400" : "text-rose-400"}`}>
                  <img src="/earth.jpg" alt="Tierra" className="h-4 w-4 rounded-full object-cover" />
                  {nomEarthOk ? "✓" : "✕"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 pt-2 text-[11px]">
              <span className="font-medium text-neutral-300">
                {en ? `Delayed (+${delayHours}h)` : `Con retraso (+${delayHours}h)`}
              </span>
              <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold">
                <span className={`inline-flex items-center gap-1 ${criSunOk ? "text-emerald-400" : "text-rose-400"}`}>
                  <img src="/sun.jpg" alt="Sol" className="h-4 w-4 rounded-full object-cover" />
                  {criSunOk ? "✓" : "✕"}
                </span>
                <span className={`inline-flex items-center gap-1 ${criEarthOk ? "text-emerald-400" : "text-rose-400"}`}>
                  <img src="/earth.jpg" alt="Tierra" className="h-4 w-4 rounded-full object-cover" />
                  {criEarthOk ? "✓" : "✕"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 rounded border border-neutral-800/80 bg-[#121212]/80 px-2.5 py-1.5 text-[10px] leading-snug text-neutral-400">
            ⏳{" "}
            {en
              ? "Guaranteed for 7 days after landing (then lunar night begins)."
              : "Tienes 7 días asegurados tras el alunizaje; después entra la noche lunar."}
          </div>

          {opt && !(nominalOk && crisisOk) && (
            <button
              type="button"
              onClick={() => setTime(opt.launchMs)}
              className="mt-2.5 w-full rounded border border-emerald-500/60 bg-emerald-950/60 px-2.5 py-2 text-[11px] font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-900/70 hover:text-white"
            >
              {en
                ? `💡 Jump to Safe Launch Date (${formatShortDay(opt.launchMs, lang)})`
                : `💡 Ir a fecha segura (${formatShortDay(opt.launchMs, lang)})`}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAdvancedHud(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-700 bg-[#161616] px-3 py-2 text-[11px] font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
        >
          <span>⚙</span>
          <span>{en ? "Show Advanced Options" : "Opciones Avanzadas"}</span>
        </button>
      </div>
    );
  }

  let title = en ? "NOMINAL OPERATION" : "OPERACIÓN NOMINAL";
  let detail = en
    ? `With a +${delayHours}h launch delay, the site maintains sunlight and direct Earth link.`
    : `Con un retraso de ${delayHours}h, el sitio mantiene luz solar y enlace directo con la Tierra.`;
  let tone: "danger" | "warn" | "safe" = "safe";

  if (delayDegrades) {
    tone = "danger";
    title = en ? "CRITICAL WARNING!" : "¡ADVERTENCIA CRÍTICA!";
    const losses = [
      crisisLostSun ? (en ? "solar visibility" : "visibilidad solar") : "",
      crisisLostEarth ? (en ? "direct Earth link" : "enlace directo con la Tierra") : "",
    ]
      .filter(Boolean)
      .join(en ? " and " : " y ");
    detail = en
      ? `A ${delayHours}h launch delay causes loss of ${losses} due to local terrain occlusion.`
      : `El retraso de ${delayHours}h en el lanzamiento causa pérdida de ${losses} por oclusión del relieve local.`;
  } else if (bothBad) {
    tone = "warn";
    title = en ? "SITE OCCLUDED" : "SITIO EN OCLUSIÓN";
    detail = en
      ? "Both nominal and delayed windows experience blockage by the topographic horizon."
      : "Tanto la ventana nominal como la retrasada presentan bloqueo por el horizonte topográfico.";
  } else if (!nominalOk && !crisis.occ.any) {
    tone = "safe";
    title = en ? `FAVORABLE WINDOW (+${delayHours}H)` : `VENTANA FAVORABLE (+${delayHours}H)`;
    detail = en
      ? `The ${delayHours}h delay shifts the site out of initial occlusion and restores full visibility.`
      : `El retraso de ${delayHours}h saca al sitio de la oclusión inicial y recupera visibilidad completa.`;
  }

  const boxClass =
    tone === "danger"
      ? "border-rose-500/70 bg-rose-950/35 text-rose-200"
      : tone === "warn"
        ? "border-neutral-700 bg-neutral-900 text-neutral-200"
        : "border-neutral-700 bg-neutral-900/70 text-neutral-200";

  const titleClass =
    tone === "danger"
      ? "animate-lethal text-rose-400"
      : tone === "warn"
        ? "text-amber-300"
        : "text-emerald-400";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setAdvancedHud(false)}
        className="flex w-full items-center justify-between rounded-md border border-white/40 bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
      >
        <span>⚙ {en ? "Advanced Options Active" : "Opciones Avanzadas Activas"}</span>
        <span className="font-mono text-[10px] text-neutral-400">{en ? "Simple View ✕" : "Vista Simple ✕"}</span>
      </button>

      <ViabilityVerdictCard />

      <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
        <div className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-400">
          {en ? "OPERATIONAL ALERTS" : "ALERTAS OPERACIONALES"}
        </div>

        <div role="alert" className={`rounded border p-3 text-center ${boxClass}`}>
          <div className={`text-xs font-bold tracking-wider ${titleClass}`}>{title}</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-300">{detail}</p>
          {freezes && (
            <div className="mt-2 rounded border border-rose-500/50 bg-rose-950/60 px-2 py-1 font-mono text-[10px] font-semibold text-rose-300">
              {en
                ? `❄ ${veh.name}: shadow exceeds its ${veh.maxDarkHours}h thermal limit`
                : `❄ ${veh.name}: sombra supera su límite térmico de ${veh.maxDarkHours}h`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
