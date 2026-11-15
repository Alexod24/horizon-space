"use client";

import { useMemo } from "react";
import { sampleOrbital } from "@/lib/engine/data";
import { occlusionFromMask, type AzEl, type OcclusionResult } from "@/lib/engine/occlusion";
import { fractionVisible, indexAt, windowAt, type WindowInfo } from "@/lib/engine/timeline";
import { useMissionStore } from "@/store/useMissionStore";

export type Risk = "ALTO" | "MEDIO" | "BAJO";

export interface ScenarioState {
  timeMs: number;
  index: number;
  sun: AzEl;
  earth: AzEl;
  occ: OcclusionResult;
  sunWindow: WindowInfo;
  earthWindow: WindowInfo;
  sunRising: boolean;
  earth7d: number;
  sun7d: number;
  risk: Risk;
  riskReason: string;
}

const DAY = 86_400_000;

export function useScenario(offsetHours: number): ScenarioState | null {
  const data = useMissionStore((s) => s.data);
  const timeMs = useMissionStore((s) => s.timeMs) + offsetHours * 3.6e6;

  return useMemo(() => {
    if (!data) return null;
    const { timeline: tl, vis, mask, maskStep } = data;
    const index = indexAt(tl, timeMs);
    const { sun, earth } = sampleOrbital(tl, timeMs);
    const ahead = sampleOrbital(tl, timeMs + tl.stepMs);
    const occ = occlusionFromMask(mask, maskStep, sun, earth);
    const sunWindow = windowAt(vis.sunVis, vis.sunNext, index, tl.stepMs);
    const earthWindow = windowAt(vis.earthVis, vis.earthNext, index, tl.stepMs);
    const weekSteps = Math.round((7 * DAY) / tl.stepMs);
    const earth7d = fractionVisible(vis.earthPrefix, index, weekSteps);
    const sun7d = fractionVisible(vis.sunPrefix, index, weekSteps);

    let risk: Risk = "BAJO";
    let riskReason = "Ventanas amplias de luz y enlace";
    if (occ.sun || occ.earth) {
      risk = "ALTO";
      riskReason = occ.sun && occ.earth ? "Sin luz ni enlace" : occ.sun ? "Sitio en sombra" : "Tierra oculta por relieve";
    } else {
      const minWin = Math.min(sunWindow.msToChange, earthWindow.msToChange);
      if (minWin < DAY) {
        risk = "ALTO";
        riskReason = "Próximo eclipse por relieve < 24 h";
      } else if (minWin < 3 * DAY) {
        risk = "MEDIO";
        riskReason = "Próximo eclipse por relieve < 72 h";
      }
    }

    return {
      timeMs, index, sun, earth, occ, sunWindow, earthWindow,
      sunRising: ahead.sun.el > sun.el,
      earth7d, sun7d, risk, riskReason,
    };
  }, [data, timeMs]);
}
