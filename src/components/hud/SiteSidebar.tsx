"use client";

import { SITES } from "@/lib/sites";
import { useMissionStore } from "@/store/useMissionStore";

export default function SiteSidebar() {
  const siteId = useMissionStore((s) => s.siteId);

  return (
    <aside className="hidden w-44 shrink-0 flex-col border-r border-neutral-800 bg-[#141414] p-3 lg:flex">
      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-neutral-800 bg-[#1a1a1a] p-2.5">
        <img
          src="/logo.jpg"
          alt="Horizon Space"
          className="h-8 w-8 shrink-0 rounded border border-neutral-700 object-cover"
        />
        <div className="leading-tight">
          <div className="text-[10px] font-medium tracking-wider text-neutral-500">SPACE APPS</div>
          <div className="font-mono text-sm font-bold text-white">2026</div>
        </div>
      </div>

      <div className="mb-2 px-1 text-[10px] font-semibold tracking-[0.14em] text-neutral-500">
        SITIOS LUNARES
      </div>

      <nav className="flex flex-col gap-1">
        {SITES.map((s) => {
          const active = s.id === siteId;
          return (
            <button
              key={s.id}
              disabled={!s.ready}
              title={s.ready ? `${s.name}` : "Requiere efemérides Horizons y LOLA DEM"}
              className={`flex items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition ${
                active
                  ? "bg-white font-semibold text-black"
                  : "cursor-not-allowed text-neutral-500 hover:bg-neutral-900/40"
              }`}
            >
              <span>{s.name}</span>
              {!s.ready && <span className="text-[9px] text-neutral-600">Pronto</span>}
            </button>
          );
        })}

        <button
          disabled
          title="Carga personalizada disponible al conectar servidor/archivo DEM"
          className="mt-1 cursor-not-allowed rounded border border-dashed border-neutral-800 px-2.5 py-1.5 text-left text-xs text-neutral-600"
        >
          Custom Coords...
        </button>
      </nav>
    </aside>
  );
}
