"use client";

import { findVehicle } from "@/lib/vehicles";
import { useMissionStore } from "@/store/useMissionStore";

export default function SiteSidebar() {
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const landingSite = useMissionStore((s) => s.landingSite);
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";
  const veh = findVehicle(vehicleId);

  return (
    <aside className="hidden w-48 shrink-0 flex-col justify-between gap-3 border-r border-neutral-800 bg-[#141414] p-3 text-xs lg:flex">
      <div className="space-y-3">
        <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-2.5">
          <div className="mb-1.5 text-[9px] font-semibold tracking-[0.14em] text-neutral-400">
            {en ? "ACTIVE VEHICLE" : "EQUIPO ACTIVO"}
          </div>
          {veh.image && (
            <div className="mb-2 h-20 w-full overflow-hidden rounded border border-neutral-800 bg-[#111111] p-1">
              <img src={veh.image} alt={veh.name} className="h-full w-full object-contain" />
            </div>
          )}
          <div className="text-[11px] font-semibold leading-tight text-white">{veh.name}</div>
          <div className="mt-0.5 text-[10px] text-neutral-500">{veh.agency}</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <div className="rounded border border-neutral-800 bg-[#121212] px-1.5 py-1">
              <div className="text-[8px] text-neutral-500">{en ? "MAST" : "MÁSTIL"}</div>
              <div className="font-semibold text-white">{veh.heightM.toFixed(1)}m</div>
            </div>
            <div className="rounded border border-neutral-800 bg-[#121212] px-1.5 py-1">
              <div className="text-[8px] text-neutral-500">{en ? "BATTERY" : "BATERÍA"}</div>
              <div className="font-semibold text-white">{veh.maxDarkHours}h</div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-2.5">
          <div className="mb-1.5 text-[9px] font-semibold tracking-[0.14em] text-neutral-400">
            {en ? "LANDING POINT" : "PUNTO MARCADO"}
          </div>
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">{en ? "East (X):" : "Este (X):"}</span>
              <span className="text-white">{landingSite.x >= 0 ? "+" : ""}{landingSite.x.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{en ? "North (Y):" : "Norte (Y):"}</span>
              <span className="text-white">{landingSite.y >= 0 ? "+" : ""}{landingSite.y.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{en ? "Elev:" : "Elev:"}</span>
              <span className="text-white">{landingSite.elevationM >= 0 ? "+" : ""}{landingSite.elevationM.toFixed(0)} m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-neutral-800 bg-[#1a1a1a] p-2.5">
        <div className="mb-2 text-[9px] font-semibold tracking-[0.14em] text-neutral-400">
          {en ? "3D MAP GUIDE" : "GUÍA DEL MAPA 3D"}
        </div>
        <div className="space-y-1.5 text-[10px] text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff9a3c]" />
            <span>{en ? "Sun (Solar Power)" : "Sol (Energía)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3db8ff]" />
            <span>{en ? "Earth (Signal)" : "Tierra (Señal)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-2.5 shrink-0 bg-[#ff3b4e]" />
            <span>{en ? "Blocking Horizon" : "Relieve que bloquea"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-neutral-500 text-[8px] font-bold text-white">?</span>
            <span>{en ? "South Pole Zones" : "Zonas del Polo Sur"}</span>
          </div>
          <div className="flex items-center gap-2 pt-0.5 text-[9px] text-neutral-500">
            <span className="font-mono text-neutral-300">↑↓←→</span>
            <span>{en ? "Pan map" : "Mover mapa"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
