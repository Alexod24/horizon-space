"use client";

import { formatDuration } from "@/lib/scene";
import { useScenario } from "@/lib/useScenario";

const RISK_STYLE = {
  ALTO: "text-rose-400",
  MEDIO: "text-amber-300",
  BAJO: "text-emerald-400",
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
export function CompactMetricsCard({ offsetHours }: { offsetHours: number }) {
  const sc = useScenario(offsetHours);
  if (!sc) return null;

  const sunPct = sc.sunWindow.visible
    ? Math.min((sc.sunWindow.msToChange / (7 * 86_400_000)) * 100, 100)
    : 0;
  const earthPct = sc.earthWindow.visible
    ? Math.min((sc.earthWindow.msToChange / (7 * 86_400_000)) * 100, 100)
    : 0;

  return (
    <div className="shrink-0 rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400">MÉTRICAS CRÍTICAS</span>
        <span className="font-mono text-[10px] text-neutral-400">
          Sol {sc.sun.el.toFixed(2)}° · Tierra {sc.occ.earth ? "OFF" : "ON"}
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.sunWindow.visible ? "Ventana solar restante" : "Próximo amanecer"}
            </span>
            <span className={`font-mono font-semibold ${sc.occ.sun ? "text-rose-400" : "text-white"}`}>
              {sc.occ.sun ? `Oculto (${formatDuration(sc.sunWindow.msToChange)})` : formatDuration(sc.sunWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={sunPct} color={sc.occ.sun ? "#ff3b4e" : "#ffffff"} />
        </div>

        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.earthWindow.visible ? "Ventana de com. directa" : "Próximo enlace"}
            </span>
            <span className={`font-mono font-semibold ${sc.occ.earth ? "text-rose-400" : "text-white"}`}>
              {sc.occ.earth ? `Sin enlace (${formatDuration(sc.earthWindow.msToChange)})` : formatDuration(sc.earthWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={earthPct} color={sc.occ.earth ? "#ff3b4e" : "#a3a3a3"} />
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 pt-2 text-[11px]">
          <span className="text-neutral-400">Riesgo de blackout</span>
          <span className="font-mono">
            <strong className={RISK_STYLE[sc.risk]}>{sc.risk}</strong>{" "}
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
  if (!sc) return null;

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
        <div className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400">MÉTRICAS CRÍTICAS</div>
        <div className="mt-0.5 text-[10px] font-bold tracking-widest text-neutral-200">SOLAR</div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.sunWindow.visible ? "Ventana solar restante" : "Próximo amanecer"}
            </span>
            <span className="font-mono font-semibold text-white">
              {formatDuration(sc.sunWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={sunPct} color={sc.occ.sun ? "#ff3b4e" : "#ffffff"} />
        </div>

        <div className="mt-3 border-t border-neutral-800 pt-2">
          <div className="text-[10px] text-neutral-500">Ángulo de elevación solar</div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className={`font-mono text-base font-bold ${sc.occ.sun ? "text-rose-400" : "text-white"}`}>
              {sc.sun.el.toFixed(2)}°{" "}
              <span className="text-xs font-normal text-neutral-400">
                ({sc.sunRising ? "Ascendente" : "Descendente"})
              </span>
            </span>
            <span className={`text-[10px] font-bold ${sc.occ.sun ? "text-rose-400" : "text-emerald-400"}`}>
              {sc.occ.sun ? "OCULTO" : "VISIBLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Comms Card */}
      <div className="rounded-md border border-neutral-800 bg-[#161616] p-3 text-xs">
        <div className="text-[10px] font-bold tracking-[0.14em] text-neutral-200">COMUNICACIONES</div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-neutral-400">
              {sc.earthWindow.visible ? "Ventana com. directa" : "Próximo enlace"}
            </span>
            <span className="font-mono font-semibold text-white">
              {formatDuration(sc.earthWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={earthPct} color={sc.occ.earth ? "#ff3b4e" : "#a3a3a3"} />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-2">
          <div>
            <div className="text-[10px] text-neutral-500">Estado de enlace</div>
            <div className={`font-mono text-sm font-bold ${sc.occ.earth ? "text-rose-400" : "text-emerald-400"}`}>
              {sc.occ.earth ? "Sin enlace directo" : "Estable"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-500">Vis. 7 días</div>
            <div className="font-mono text-sm font-bold text-white">
              {(sc.earth7d * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
