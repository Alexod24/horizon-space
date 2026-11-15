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
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800/90">
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
    <div className="shrink-0 rounded-md border border-sky-500/20 bg-[#081221] p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.18em] text-slate-300">MÉTRICAS CRÍTICAS</span>
        <span className="font-mono text-[10px] text-slate-400">
          SOL {sc.sun.el.toFixed(2)}° · TIERRA {sc.occ.earth ? "OFF" : "ON"}
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">
              {sc.sunWindow.visible ? "VENTANA SOLAR RESTANTE:" : "PRÓXIMO AMANECER EN:"}
            </span>
            <span className={`font-mono font-bold ${sc.occ.sun ? "text-rose-400" : "text-[#ff9a3c]"}`}>
              {sc.occ.sun ? `OCULTO (${formatDuration(sc.sunWindow.msToChange)})` : formatDuration(sc.sunWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={sunPct} color={sc.occ.sun ? "#ff3b4e" : "#ff9a3c"} />
        </div>

        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">
              {sc.earthWindow.visible ? "VENTANA DE COM. DIRECTA:" : "PRÓXIMO ENLACE EN:"}
            </span>
            <span className={`font-mono font-bold ${sc.occ.earth ? "text-rose-400" : "text-[#3db8ff]"}`}>
              {sc.occ.earth ? `SIN ENLACE (${formatDuration(sc.earthWindow.msToChange)})` : formatDuration(sc.earthWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={earthPct} color={sc.occ.earth ? "#ff3b4e" : "#3db8ff"} />
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
          <span className="text-slate-400">RIESGO DE BLACKOUT:</span>
          <span className="font-mono">
            <strong className={RISK_STYLE[sc.risk]}>{sc.risk}</strong>{" "}
            <span className="text-slate-400">({sc.riskReason})</span>
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
      <div className="rounded-md border border-sky-500/20 bg-[#081221] p-3 text-xs">
        <div className="text-[10px] font-bold tracking-[0.18em] text-slate-300">MÉTRICAS CRÍTICAS</div>
        <div className="mt-0.5 text-[10px] font-bold tracking-widest text-[#ff9a3c]">SOLAR</div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">
              {sc.sunWindow.visible ? "VENTANA SOLAR RESTANTE:" : "PRÓXIMO AMANECER:"}
            </span>
            <span className="font-mono font-bold text-white">
              {formatDuration(sc.sunWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={sunPct} color={sc.occ.sun ? "#ff3b4e" : "#ff9a3c"} />
        </div>

        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="text-[10px] tracking-wider text-slate-400">ÁNGULO DE ELEVACIÓN SOLAR:</div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className={`font-mono text-base font-bold ${sc.occ.sun ? "text-rose-400" : "text-white"}`}>
              {sc.sun.el.toFixed(2)}°{" "}
              <span className="text-xs font-normal text-slate-400">
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
      <div className="rounded-md border border-sky-500/20 bg-[#081221] p-3 text-xs">
        <div className="text-[10px] font-bold tracking-[0.18em] text-[#3db8ff]">COMUNICACIONES</div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">
              {sc.earthWindow.visible ? "VENTANA COM. DIRECTA:" : "PRÓXIMO ENLACE:"}
            </span>
            <span className="font-mono font-bold text-white">
              {formatDuration(sc.earthWindow.msToChange)}
            </span>
          </div>
          <ProgressBar pct={earthPct} color={sc.occ.earth ? "#ff3b4e" : "#3db8ff"} />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <div>
            <div className="text-[10px] tracking-wider text-slate-400">ESTADO DE ENLACE:</div>
            <div className={`font-mono text-sm font-bold ${sc.occ.earth ? "text-rose-400" : "text-emerald-400"}`}>
              {sc.occ.earth ? "Sin enlace directo" : "Estable"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400">VIS. 7 DÍAS</div>
            <div className="font-mono text-sm font-bold text-sky-300">
              {(sc.earth7d * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
