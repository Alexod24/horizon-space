import { create } from "zustand";
import type { OrbitalTimeline } from "@/lib/engine/data";
import { buildHorizonMask, sampleHeight, type TerrainMatrix } from "@/lib/engine/occlusion";
import { computeVisibility, type Visibility } from "@/lib/engine/timeline";

export interface MissionData {
  timeline: OrbitalTimeline;
  terrain: TerrainMatrix;
  contextTerrain: TerrainMatrix | null;
  mask: Float32Array;
  maskStep: number;
  vis: Visibility;
  terrainSource: "lola" | "placeholder";
}

export type TerrainMode = "tactical" | "realistic";

interface MissionState {
  status: "loading" | "ready" | "error";
  error?: string;
  data: MissionData | null;
  siteId: string;
  /** Nominal landing instant (UTC ms). */
  timeMs: number;
  delayHours: number;
  compare: boolean;
  terrainMode: TerrainMode;
  isolatePole: boolean;
  missionStarted: boolean;
  /** Landing site offset in km from zone centre (x = East, y = North). */
  landingSite: { x: number; y: number; elevationM: number };
  playing: boolean;
  /** Simulated hours per real second. */
  speed: number;
  /** Distance (km) if user clicked outside the 15 km South Pole landing zone. */
  outOfBoundsKm: number | null;
  setData: (d: MissionData, startMs: number) => void;
  setError: (e: string) => void;
  setTime: (ms: number) => void;
  setDelay: (h: number) => void;
  setCompare: (c: boolean) => void;
  setTerrainMode: (m: TerrainMode) => void;
  setIsolatePole: (v: boolean) => void;
  setMissionStarted: (v: boolean) => void;
  setLandingSite: (xKm: number, yKm: number) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  setOutOfBoundsKm: (km: number | null) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  status: "loading",
  data: null,
  siteId: "shackleton",
  timeMs: 0,
  delayHours: 48,
  compare: true,
  terrainMode: "realistic",
  isolatePole: false,
  missionStarted: false,
  landingSite: { x: 0, y: 0, elevationM: 0 },
  playing: false,
  speed: 6,
  outOfBoundsKm: null,
  setData: (data, startMs) => {
    const h0 = sampleHeight(data.terrain, 0, 0);
    set({
      data,
      status: "ready",
      timeMs: startMs,
      landingSite: { x: 0, y: 0, elevationM: Number.isNaN(h0) ? 0 : h0 },
    });
  },
  setError: (error) => set({ status: "error", error }),
  setTime: (timeMs) =>
    set((s) => {
      if (!s.data) return { timeMs };
      const { t0Ms, t1Ms } = s.data.timeline;
      return { timeMs: Math.min(Math.max(timeMs, t0Ms), t1Ms - s.delayHours * 3.6e6) };
    }),
  setDelay: (delayHours) => set({ delayHours }),
  setCompare: (compare) => set({ compare }),
  setTerrainMode: (terrainMode) => set({ terrainMode }),
  setIsolatePole: (isolatePole) => set({ isolatePole }),
  setMissionStarted: (missionStarted) => set({ missionStarted }),
  setLandingSite: (xKm, yKm) => {
    const d = get().data;
    if (!d) return;
    const r = Math.hypot(xKm, yKm);
    if (r > 14.5) {
      xKm = (xKm / r) * 14.5;
      yKm = (yKm / r) * 14.5;
    }
    const ox = xKm * 1000;
    const oy = yKm * 1000;
    const h = sampleHeight(d.terrain, ox, oy);
    const elevationM = Number.isNaN(h) ? 0 : h;
    const opts = { observerX: ox, observerY: oy, observerHeight: 2 };
    const mask = buildHorizonMask(d.terrain, d.maskStep, opts);
    const vis = computeVisibility(d.timeline, mask, d.maskStep);
    set({
      landingSite: { x: xKm, y: yKm, elevationM },
      outOfBoundsKm: null,
      data: { ...d, mask, vis },
    });
  },
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setOutOfBoundsKm: (outOfBoundsKm) => set({ outOfBoundsKm }),
}));
