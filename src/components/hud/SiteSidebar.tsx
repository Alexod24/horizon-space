"use client";

import { SITES } from "@/lib/sites";
import { useMissionStore } from "@/store/useMissionStore";

export default function SiteSidebar() {
  const siteId = useMissionStore((s) => s.siteId);

  return (
    <aside className="hidden w-44 shrink-0 flex-col border-r border-sky-500/20 bg-[#070f1c] p-3 lg:flex">
      {/* Space Apps Badge */}
      <div className="mb-4 flex items-center gap-2.5 rounded border border-sky-500/25 bg-[#0b1628] p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-400/50 bg-sky-500/10 text-sm text-sky-300">
          ▲
        </div>
        <div className="leading-tight">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400">SPACE APPS</div>
          <div className="font-mono text-sm font-bold text-white">2026</div>
        </div>
      </div>

      <div className="mb-2 px-1 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
        LISTA DE SITIOS
      </div>

      <nav className="flex flex-col gap-1.5">
        {SITES.map((s) => {
          const active = s.id === siteId;
          return (
            <button
              key={s.id}
              disabled={!s.ready}
              title={s.ready ? `${s.name}` : "Requiere efemérides Horizons y LOLA DEM"}
              className={`flex items-center justify-between rounded border px-3 py-2 text-left text-xs transition ${
                active
                  ? "border-sky-400/70 bg-sky-500/20 font-semibold text-white shadow-[inset_0_0_12px_rgba(61,184,255,0.2)]"
                  : "cursor-not-allowed border-white/10 bg-white/[0.02] text-slate-500"
              }`}
            >
              <span>{s.name}</span>
              {!s.ready && <span className="text-[9px] text-slate-600">PRONTO</span>}
            </button>
          );
        })}

        <button
          disabled
          title="Carga personalizada disponible al conectar servidor/archivo DEM"
          className="mt-1 cursor-not-allowed rounded border border-dashed border-white/15 px-3 py-2 text-left text-xs text-slate-500"
        >
          Custom Coords...
        </button>
      </nav>
    </aside>
  );
}
