"use client";

import { useScenario } from "@/lib/useScenario";
import { useMissionStore } from "@/store/useMissionStore";

export default function OperationalAlert() {
  const delayHours = useMissionStore((s) => s.delayHours);
  const nominal = useScenario(0);
  const crisis = useScenario(delayHours);

  if (!nominal || !crisis) return null;

  const nominalOk = !nominal.occ.any;
  const crisisLostSun = !nominal.occ.sun && crisis.occ.sun;
  const crisisLostEarth = !nominal.occ.earth && crisis.occ.earth;
  const delayDegrades = crisisLostSun || crisisLostEarth;
  const bothBad = nominal.occ.any && crisis.occ.any;

  let title = "OPERACIÓN NOMINAL";
  let detail = `Con un retraso de ${delayHours}h, el sitio mantiene luz solar y enlace directo con la Tierra.`;
  let tone: "danger" | "warn" | "safe" = "safe";

  if (delayDegrades) {
    tone = "danger";
    title = "¡ADVERTENCIA CRÍTICA!";
    const losses = [
      crisisLostSun ? "visibilidad solar" : "",
      crisisLostEarth ? "enlace directo con la Tierra" : "",
    ]
      .filter(Boolean)
      .join(" y ");
    detail = `El retraso de ${delayHours}h en el lanzamiento causa pérdida de ${losses} por oclusión del relieve local.`;
  } else if (bothBad) {
    tone = "warn";
    title = "SITIO EN OCLUSIÓN";
    detail = "Tanto la ventana nominal como la retrasada presentan bloqueo por el horizonte topográfico.";
  } else if (!nominalOk && !crisis.occ.any) {
    tone = "safe";
    title = `VENTANA FAVORABLE (+${delayHours}H)`;
    detail = `El retraso de ${delayHours}h saca al sitio de la oclusión inicial y recupera visibilidad completa.`;
  }

  const boxClass =
    tone === "danger"
      ? "border-rose-500/70 bg-rose-950/40 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.2)]"
      : tone === "warn"
        ? "border-amber-500/50 bg-amber-950/30 text-amber-200"
        : "border-emerald-500/40 bg-emerald-950/25 text-emerald-200";

  const titleClass =
    tone === "danger"
      ? "animate-lethal text-rose-400"
      : tone === "warn"
        ? "text-amber-300"
        : "text-emerald-400";

  return (
    <div className="rounded-md border border-sky-500/20 bg-[#081221] p-3 text-xs">
      <div className="mb-2 text-[10px] font-bold tracking-[0.18em] text-slate-300">
        ALERTAS OPERACIONALES
      </div>

      <div role="alert" className={`rounded border p-3 text-center ${boxClass}`}>
        <div className={`text-xs font-bold tracking-wider ${titleClass}`}>{title}</div>
        <p className="mt-1.5 text-[11px] leading-relaxed opacity-90">{detail}</p>
      </div>
    </div>
  );
}
