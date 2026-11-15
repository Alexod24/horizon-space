"use client";

import { formatDuration } from "@/lib/scene";
import { useScenario } from "@/lib/useScenario";
import { useMissionStore } from "@/store/useMissionStore";

const RISK_STYLE = {
  ALTO: "text-rose-400",
  MEDIO: "text-amber-300",
  BAJO: "text-emerald-400",
} as const;

const RISK_LABEL_EN = {
  ALTO: "HIGH",
  MEDIO: "MEDIUM",
  BAJO: "LOW",
} as const;

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
      <div
        className="h-full rounded-full transition-all duration-150"
        style={{ width: `${Math.max(4, Math.min(pct, 100))}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Compact card shown below each 3D viewport in Compare mode. */
export function CompactMetricsCard({
  offsetHours,
  stacked = false,
}: {
  offsetHours: number;
  stacked?: boolean;
}) {
  const sc = useScenario(offsetHours);
  const lang = useMissionStore((s) => s.lang);
  const advancedHud = useMissionStore((s) => s.advancedHud);
  const en = lang === "en";
  if (!sc) return null;

  const sunOk = !sc.occ.sun;
  const earthOk = !sc.occ.earth;
  const viableNow = sunOk && earthOk;

  if (!advancedHud) {
    return (
      <div className="shrink-0 rounded-md border border-neutral-800 bg-[#161616] p-2.5 text-xs">
        {/* Top Viability Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${
                viableNow
                  ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-400"
                  : "border-rose-500/60 bg-rose-950/60 text-rose-400"
              }`}
            >
              {viableNow ? "✓" : "✕"}
            </span>
            <span className={`font-bold ${viableNow ? "text-emerald-400" : "text-rose-400"}`}>
              {viableNow
                ? en
                  ? "Viable Landing"
                  : "Aterrizaje Viable"
                : en
                  ? "Not Viable"
                  : "No Viable"}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">
            {viableNow
              ? en
                ? "Sun & Earth connected"
                : "Con luz y comunicación"
              : !sunOk && !earthOk
                ? en
                  ? "In shadow & no signal"
                  : "En sombra y sin señal"
                : !sunOk
                  ? en
                    ? "Blocked by shadow"
                    : "En sombra del cráter"
                  : en
                    ? "No Earth signal"
                    : "Sin señal con la Tierra"}
          </span>
        </div>

        {/* Two Visual Boxes: Real Sun Image + Check & Real Earth Image + Check */}
        <div className={stacked ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
          {/* Sun Box */}
          <div
            className={`flex items-center justify-between gap-2 rounded-md border p-2 ${
              sunOk
                ? "border-emerald-500/40 bg-emerald-950/20"
                : "border-rose-500/50 bg-rose-950/25"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <img
                src="/sun.jpg"
                alt={en ? "Sun" : "Sol"}
                className="h-9 w-9 shrink-0 rounded-full border border-amber-400/40 object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold text-white">
                  {en ? "Sun (Light)" : "Sol (Luz)"}
                </div>
                <div className={`truncate text-[10px] ${sunOk ? "text-emerald-300" : "text-rose-300"}`}>
                  {sunOk ? (en ? "Illuminated" : "Con luz solar") : en ? "In shadow" : "En sombra"}
                </div>
              </div>
            </div>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                sunOk
                  ? "border-emerald-500/60 bg-emerald-950/70 text-emerald-400"
                  : "border-rose-500/60 bg-rose-950/70 text-rose-400"
              }`}
            >
              {sunOk ? "✓" : "✕"}
            </span>
          </div>

          {/* Earth Box */}
          <div
            className={`flex items-center justify-between gap-2 rounded-md border p-2 ${
              earthOk
                ? "border-emerald-500/40 bg-emerald-950/20"
                : "border-rose-500/50 bg-rose-950/25"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <img
                src="/earth.jpg"
                alt={en ? "Earth" : "Tierra"}
                className="h-9 w-9 shrink-0 rounded-full border border-sky-400/40 object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold text-white">
                  {en ? "Earth (Signal)" : "Tierra (Señal)"}
                </div>
                <div className={`truncate text-[10px] ${earthOk ? "text-emerald-300" : "text-rose-300"}`}>
                  {earthOk ? (en ? "In contact" : "En contacto") : en ? "Blocked" : "Sin señal"}
                </div>
              </div>
            </div>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                earthOk
                  ? "border-emerald-500/60 bg-emerald-950/70 text-emerald-400"
                  : "border-rose-500/60 bg-rose-950/70 text-rose-400"
              }`}
            >
              {earthOk ? "✓" : "✕"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const sunPct = sc.sunWindow.visible
    ? Math.min((sc.sunWindow.msToChange / (7 * 86_400_000)) * 100, 100)
    : 0;
  const earthPct = sc.earthWindow.visible
    ? Math.min((sc.earthWindow.msToChange / (7 * 86_400_000)) * 100, 100)
    : 0;

  return (
    <div className="shrink-0 rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400">
          {en ? "CRITICAL METRICS" : "MÉTRICAS CRÍTICAS"}
        </span>
        <span className="font-mono text-[10px] text-neutral-400">
          {en ? "Sun" : "Sol"} {sc.sun.el.toFixed(2)}° · {en ? "Earth" : "Tierra"} {sc.occ.earth ? "OFF" : "ON"}
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.sunWindow.visible
                ? en ? "Remaining solar window" : "Ventana solar restante"
                : en ? "Next sunrise" : "Próximo amanecer"}
            </span>
            <span className={`font-mono font-semibold ${sc.occ.sun ? "text-rose-400" : "text-white"}`}>
              {sc.occ.sun
                ? `${en ? "Occluded" : "Oculto"} (${formatDuration(sc.sunWindow.msToChange, lang)})`
                : formatDuration(sc.sunWindow.msToChange, lang)}
            </span>
          </div>
          <ProgressBar pct={sunPct} color={sc.occ.sun ? "#ff3b4e" : "#ffffff"} />
        </div>

        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.earthWindow.visible
                ? en ? "Direct comms window" : "Ventana de com. directa"
                : en ? "Next link" : "Próximo enlace"}
            </span>
            <span className={`font-mono font-semibold ${sc.occ.earth ? "text-rose-400" : "text-white"}`}>
              {sc.occ.earth
                ? `${en ? "No link" : "Sin enlace"} (${formatDuration(sc.earthWindow.msToChange, lang)})`
                : formatDuration(sc.earthWindow.msToChange, lang)}
            </span>
          </div>
          <ProgressBar pct={earthPct} color={sc.occ.earth ? "#ff3b4e" : "#a3a3a3"} />
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 pt-2 text-[11px]">
          <span className="text-neutral-400">{en ? "Blackout risk" : "Riesgo de blackout"}</span>
          <span className="font-mono">
            <strong className={RISK_STYLE[sc.risk]}>{en ? RISK_LABEL_EN[sc.risk] : sc.risk}</strong>{" "}
            <span className="text-neutral-500">({sc.riskReason})</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Detailed stacked cards shown in the right sidebar when in single-viewport mode. */
export function DetailedMetricsCards({ offsetHours }: { offsetHours: number }) {
  const sc = useScenario(offsetHours);
  const lang = useMissionStore((s) => s.lang);
  const advancedHud = useMissionStore((s) => s.advancedHud);
  const en = lang === "en";
  if (!sc) return null;

  if (!advancedHud) {
    return <CompactMetricsCard offsetHours={offsetHours} stacked />;
  }

  const sunPct = sc.sunWindow.visible
    ? Math.min((sc.sunWindow.msToChange / (7 * 86_400_000)) * 100, 100)
    : 0;
  const earthPct = sc.earthWindow.visible
    ? Math.min((sc.earthWindow.msToChange / (7 * 86_400_000)) * 100, 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* Solar Card */}
      <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
        <div className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400">
          {en ? "CRITICAL METRICS" : "MÉTRICAS CRÍTICAS"}
        </div>
        <div className="mt-0.5 text-[10px] font-bold tracking-widest text-neutral-200">SOLAR</div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.sunWindow.visible
                ? en ? "Remaining solar window" : "Ventana solar restante"
                : en ? "Next sunrise" : "Próximo amanecer"}
            </span>
            <span className="font-mono font-semibold text-white">
              {formatDuration(sc.sunWindow.msToChange, lang)}
            </span>
          </div>
          <ProgressBar pct={sunPct} color={sc.occ.sun ? "#ff3b4e" : "#ffffff"} />
        </div>

        <div className="mt-3 border-t border-neutral-800 pt-2">
          <div className="text-[10px] text-neutral-500">{en ? "Solar elevation angle" : "Ángulo de elevación solar"}</div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className={`font-mono text-base font-bold ${sc.occ.sun ? "text-rose-400" : "text-white"}`}>
              {sc.sun.el.toFixed(2)}°{" "}
              <span className="text-xs font-normal text-neutral-400">
                ({sc.sunRising ? (en ? "Rising" : "Ascendente") : (en ? "Setting" : "Descendente")})
              </span>
            </span>
            <span className={`text-[10px] font-bold ${sc.occ.sun ? "text-rose-400" : "text-emerald-400"}`}>
              {sc.occ.sun ? (en ? "OCCLUDED" : "OCULTO") : "VISIBLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Comms Card */}
      <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
        <div className="text-[10px] font-bold tracking-[0.14em] text-neutral-200">
          {en ? "COMMUNICATIONS" : "COMUNICACIONES"}
        </div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.earthWindow.visible
                ? en ? "Direct comms window" : "Ventana com. directa"
                : en ? "Next link" : "Próximo enlace"}
            </span>
            <span className="font-mono font-semibold text-white">
              {formatDuration(sc.earthWindow.msToChange, lang)}
            </span>
          </div>
          <ProgressBar pct={earthPct} color={sc.occ.earth ? "#ff3b4e" : "#a3a3a3"} />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-2">
          <div>
            <div className="text-[10px] text-neutral-500">{en ? "Link status" : "Estado de enlace"}</div>
            <div className={`font-mono text-sm font-bold ${sc.occ.earth ? "text-rose-400" : "text-emerald-400"}`}>
              {sc.occ.earth ? (en ? "No direct link" : "Sin enlace directo") : (en ? "Stable" : "Estable")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-500">{en ? "7-day vis." : "Vis. 7 días"}</div>
            <div className="font-mono text-sm font-bold text-white">
              {(sc.earth7d * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
