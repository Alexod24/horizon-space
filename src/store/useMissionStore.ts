import { create } from "zustand";
import type { OrbitalTimeline } from "@/lib/engine/data";
import { buildHorizonMask, sampleHeight, type TerrainMatrix } from "@/lib/engine/occlusion";
import { computeVisibility, type Visibility } from "@/lib/engine/timeline";
import { VEHICLES, findVehicle } from "@/lib/vehicles";

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
export type Lang = "es" | "en";
export type ThemeMode = "light" | "dark";

export interface TransitProfile {
  days: number;
  labelEs: string;
  labelEn: string;
  shortEs: string;
  shortEn: string;
  descEs: string;
  descEn: string;
}

export const TRANSIT_PROFILES: TransitProfile[] = [
  {
    days: 7,
    labelEs: "Directo · 7d",
    labelEn: "Direct · 7d",
    shortEs: "7d Directo",
    shortEn: "7d Direct",
    descEs: "Transferencia directa tipo CLPS / Intuitive Machines",
    descEn: "Direct lunar transfer (CLPS / Intuitive Machines profile)",
  },
  {
    days: 14,
    labelEs: "Estándar · 14d",
    labelEn: "Standard · 14d",
    shortEs: "14d Estándar",
    shortEn: "14d Standard",
    descEs: "Inserción con órbitas de fase intermedias",
    descEn: "Phasing-loop lunar transfer profile",
  },
  {
    days: 45,
    labelEs: "Baja Energía · 45d",
    labelEn: "Low-Energy · 45d",
    shortEs: "45d Baja Energía",
    shortEn: "45d Low-Energy",
    descEs: "Transferencia balística de baja energía (BLT)",
    descEn: "Ballistic low-energy lunar transfer (BLT)",
  },
];

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

interface MissionState {
  status: "loading" | "ready" | "error";
  error?: string;
  data: MissionData | null;
  siteId: string;
  vehicleId: string;
  /** Nominal Earth launch instant T-0 (UTC ms) currently displayed. */
  timeMs: number;
  /** Anchor launch instant T-0 (UTC ms) for the 7-day guaranteed mission window. */
  plannedLaunchMs: number;
  /** Earth-to-Moon transit duration in days (e.g. 7, 14, 45). */
  transitDays: number;
  delayHours: number;
  compare: boolean;
  terrainMode: TerrainMode;
  terrainBrightness: number;
  lang: Lang;
  theme: ThemeMode;
  isolatePole: boolean;
  centerTrigger: number;
  selectedLandmarkId: string | null;
  enteredApp: boolean;
  missionStarted: boolean;
  /** False by default so Phase 2 starts in clean/simple mode for general audiences. */
  advancedHud: boolean;
  /** Landing site offset in km from zone centre (x = East, y = North). */
  landingSite: { x: number; y: number; elevationM: number };
  playing: boolean;
  /** Simulated hours per real second. */
  speed: number;
  /** Distance (km) if user clicked outside the 15 km South Pole landing zone. */
  outOfBoundsKm: number | null;
  setData: (d: MissionData, startMs: number) => void;
  setError: (e: string) => void;
  /** Sets current simulation timeMs; if anchor=true (default), also anchors the 7-day mission window. */
  setTime: (ms: number, anchor?: boolean) => void;
  setTransitDays: (days: number) => void;
  setDelay: (h: number) => void;
  setCompare: (c: boolean) => void;
  setTerrainMode: (m: TerrainMode) => void;
  setTerrainBrightness: (v: number) => void;
  setLang: (l: Lang) => void;
  setTheme: (t: ThemeMode) => void;
  setIsolatePole: (v: boolean) => void;
  triggerCenter: () => void;
  setSelectedLandmarkId: (id: string | null) => void;
  setEnteredApp: (v: boolean) => void;
  setMissionStarted: (v: boolean) => void;
  setAdvancedHud: (v: boolean) => void;
  setLandingSite: (xKm: number, yKm: number) => void;
  setVehicle: (id: string) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  setOutOfBoundsKm: (km: number | null) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  status: "loading",
  data: null,
  siteId: "shackleton",
  vehicleId: "default",
  timeMs: 0,
  plannedLaunchMs: 0,
  transitDays: 7,
  delayHours: 48,
  compare: true,
  terrainMode: "realistic",
  terrainBrightness: 1,
  lang: "es",
  theme: "dark",
  isolatePole: true,
  centerTrigger: 0,
  selectedLandmarkId: null,
  enteredApp: false,
  missionStarted: false,
  advancedHud: false,
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
      plannedLaunchMs: startMs,
      landingSite: { x: 0, y: 0, elevationM: Number.isNaN(h0) ? 0 : h0 },
    });
  },
  setError: (error) => set({ status: "error", error }),
  setTime: (timeMs, anchor = true) =>
    set((s) => {
      if (!s.data) return anchor ? { timeMs, plannedLaunchMs: timeMs } : { timeMs };
      const { t0Ms, t1Ms } = s.data.timeline;
      const maxLaunchMs = t1Ms - s.transitDays * DAY_MS - s.delayHours * HOUR_MS;
      const clamped = Math.min(Math.max(timeMs, t0Ms), maxLaunchMs);
      return anchor ? { timeMs: clamped, plannedLaunchMs: clamped } : { timeMs: clamped };
    }),
  setTransitDays: (transitDays) =>
    set((s) => {
      if (!s.data) return { transitDays };
      const { t0Ms, t1Ms } = s.data.timeline;
      const maxLaunchMs = t1Ms - transitDays * DAY_MS - s.delayHours * HOUR_MS;
      return {
        transitDays,
        timeMs: Math.min(Math.max(s.timeMs, t0Ms), maxLaunchMs),
      };
    }),
  setDelay: (delayHours) =>
    set((s) => {
      if (!s.data) return { delayHours };
      const { t0Ms, t1Ms } = s.data.timeline;
      const maxLaunchMs = t1Ms - s.transitDays * DAY_MS - delayHours * HOUR_MS;
      return {
        delayHours,
        timeMs: Math.min(Math.max(s.timeMs, t0Ms), maxLaunchMs),
      };
    }),
  setCompare: (compare) => set({ compare }),
  setTerrainMode: (terrainMode) => set({ terrainMode }),
  setTerrainBrightness: (terrainBrightness) => set({ terrainBrightness: Math.min(3, Math.max(0.5, terrainBrightness)) }),
  setLang: (lang) => set({ lang }),
  setTheme: (theme) => set({ theme }),
  setIsolatePole: (isolatePole) => set({ isolatePole }),
  triggerCenter: () => set((s) => ({ centerTrigger: s.centerTrigger + 1 })),
  setSelectedLandmarkId: (selectedLandmarkId) => set({ selectedLandmarkId }),
  setEnteredApp: (enteredApp) => set({ enteredApp }),
  setMissionStarted: (missionStarted) => set({ missionStarted }),
  setAdvancedHud: (advancedHud) => set({ advancedHud }),
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
    const veh = findVehicle(get().vehicleId);
    const opts = { observerX: ox, observerY: oy, observerHeight: veh.heightM };
    const mask = buildHorizonMask(d.terrain, d.maskStep, opts);
    const vis = computeVisibility(d.timeline, mask, d.maskStep);
    set({
      landingSite: { x: xKm, y: yKm, elevationM },
      outOfBoundsKm: null,
      data: { ...d, mask, vis },
    });
  },
  setVehicle: (vehicleId) => {
    const d = get().data;
    const veh = findVehicle(vehicleId);
    if (!d) {
      set({ vehicleId });
      return;
    }
    const { x, y } = get().landingSite;
    const opts = { observerX: x * 1000, observerY: y * 1000, observerHeight: veh.heightM };
    const mask = buildHorizonMask(d.terrain, d.maskStep, opts);
    const vis = computeVisibility(d.timeline, mask, d.maskStep);
    set({ vehicleId, data: { ...d, mask, vis } });
  },
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setOutOfBoundsKm: (outOfBoundsKm) => set({ outOfBoundsKm }),
}));
