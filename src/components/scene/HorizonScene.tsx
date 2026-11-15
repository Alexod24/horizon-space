"use client";

import { type ComponentRef, useEffect, useId, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { sampleOrbital } from "@/lib/engine/data";
import { findImpactDistance, maskHorizonAt, sampleHeight, type AzEl, type TerrainMatrix } from "@/lib/engine/occlusion";
import { COLORS, DOME_R, TERRAIN_RADIUS, VERT_EXAG, exaggerateEl, skyPoint } from "@/lib/scene";
import { getEarthTexture, getMoonRegolithTexture, getSunCoronaTexture, getSunTexture } from "@/lib/textures";
import { useScenario, type ScenarioState } from "@/lib/useScenario";
import { LUNAR_LANDMARKS } from "@/lib/landmarks";
import { findVehicle } from "@/lib/vehicles";
import { useMissionStore } from "@/store/useMissionStore";

const H = 3_600_000;

interface CameraSyncMsg {
  sourceId: string;
  pos: [number, number, number];
  target: [number, number, number];
}
const cameraSyncListeners = new Set<(msg: CameraSyncMsg) => void>();
let lastSyncedCamera: CameraSyncMsg | null = null;

// ─── Terrain ────────────────────────────────────────────────────────────────
function buildTerrainGeometry(t: TerrainMatrix, minKm = 0, maxKm = TERRAIN_RADIUS, rings = 110, segs = 240) {
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const lo = new THREE.Color("#1f1f1f");
  const mid = new THREE.Color("#6b6b6b");
  const hi = new THREE.Color("#d4d4d4");
  const tmp = new THREE.Color();
  const minM = minKm * 1000;
  const maxM = Math.min(maxKm * 1000, ((t.size - 1) / 2) * t.resolution - t.resolution);

  for (let r = 0; r <= rings; r++) {
    const rad = minM + (r / rings) * (maxM - minM);
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const x = Math.sin(a) * rad;
      const y = Math.cos(a) * rad; // north
      const hRaw = sampleHeight(t, x, y);
      const h = Number.isNaN(hRaw) ? 0 : hRaw;
      pos.push(x / 1000, (h / 1000) * VERT_EXAG, -y / 1000);
      uv.push((x / 1000 + TERRAIN_RADIUS) / (TERRAIN_RADIUS * 2), (-y / 1000 + TERRAIN_RADIUS) / (TERRAIN_RADIUS * 2));

      // Subtle hypsometric shading for tactical mode
      const u = THREE.MathUtils.clamp((h + 4500) / 6500, 0, 1);
      if (u < 0.5) tmp.copy(lo).lerp(mid, u * 2);
      else tmp.copy(mid).lerp(hi, (u - 0.5) * 2);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let r = 0; r < rings; r++)
    for (let s = 0; s < segs; s++) {
      const a = r * segs + s, b = r * segs + ((s + 1) % segs);
      const c = (r + 1) * segs + s, d = (r + 1) * segs + ((s + 1) % segs);
      idx.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Terrain({ terrain, contextTerrain }: { terrain: TerrainMatrix; contextTerrain: TerrainMatrix | null }) {
  const setOutOfBoundsKm = useMissionStore((s) => s.setOutOfBoundsKm);
  const setLandingSite = useMissionStore((s) => s.setLandingSite);
  const terrainMode = useMissionStore((s) => s.terrainMode);
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const realistic = terrainMode === "realistic";
  const moonMap = useMemo(() => getMoonRegolithTexture(), []);
  const innerGeo = useMemo(() => buildTerrainGeometry(terrain, 0, TERRAIN_RADIUS, 110, 240), [terrain]);
  const outerGeo = useMemo(
    () => (contextTerrain ? buildTerrainGeometry(contextTerrain, TERRAIN_RADIUS - 0.15, 78, 160, 240) : null),
    [contextTerrain],
  );

  return (
    <group>
      {/* Active 15 km South Pole landing zone: click to place landing site */}
      <mesh
        geometry={innerGeo}
        receiveShadow
        castShadow
        onClick={(e) => {
          if (e.delta > 4) return; // ignore orbit/pan drags
          e.stopPropagation();
          setLandingSite(e.point.x, -e.point.z);
        }}
      >
        {realistic ? (
          <meshStandardMaterial map={moonMap} color="#b0b4ba" roughness={0.98} metalness={0.02} />
        ) : (
          <meshStandardMaterial vertexColors roughness={0.92} metalness={0.05} />
        )}
      </mesh>
      {!realistic && (
        <mesh geometry={innerGeo} position-y={0.015}>
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} depthWrite={false} />
        </mesh>
      )}

      {/* Surrounding lunar terrain (15 km -> 76 km) hidden when isolatePole is active */}
      {outerGeo && !isolatePole && (
        <mesh
          geometry={outerGeo}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            const km = Math.hypot(e.point.x, e.point.z);
            setOutOfBoundsKm(km > TERRAIN_RADIUS ? Math.round(km * 10) / 10 : null);
          }}
        >
          {realistic ? (
            <meshStandardMaterial map={moonMap} color="#b0b4ba" roughness={0.98} metalness={0} />
          ) : (
            <meshStandardMaterial vertexColors color="#7d8a9c" roughness={0.96} metalness={0} />
          )}
        </mesh>
      )}
    </group>
  );
}

// ─── Sky ────────────────────────────────────────────────────────────────────
function ringPoints(elDeg: number, n = 180) {
  return Array.from({ length: n + 1 }, (_, i) => skyPoint((i / n) * 360, elDeg));
}

function SkyDome({ mask, maskStep }: { mask: Float32Array; maskStep: number }) {
  const horizon = useMemo(() => ringPoints(0), []);
  const grid = useMemo(() => [2, 5, 10].map((e) => ({ e, pts: ringPoints(e) })), []);
  const relief = useMemo(
    () => Array.from({ length: mask.length + 1 }, (_, i) => skyPoint(i * maskStep, maskHorizonAt(mask, maskStep, i * maskStep), DOME_R - 0.02)),
    [mask, maskStep],
  );
  return (
    <group>
      <mesh>
        <sphereGeometry args={[DOME_R, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.025} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={horizon} color="#e5e5e5" lineWidth={1.3} transparent opacity={0.45} />
      {grid.map(({ e, pts }) => (
        <group key={e}>
          <Line points={pts} color="#a3a3a3" lineWidth={0.6} transparent opacity={0.14} dashed dashSize={0.4} gapSize={0.4} />
          <Billboard position={skyPoint(180, e).toArray()}>
            <Text fontSize={0.55} color="#a3a3a3" fillOpacity={0.65} anchorX="center" anchorY="middle">
              {`${e}°`}
            </Text>
          </Billboard>
        </group>
      ))}
      <Line points={relief} color={COLORS.danger} lineWidth={2.2} />
      {(["N", "E", "S", "O"] as const).map((l, i) => (
        <Billboard key={l} position={skyPoint(i * 90, 0, DOME_R + 1.2).toArray()}>
          <Text
            fontSize={0.85}
            color={l === "N" ? "#f87171" : "#a3a3a3"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#000000"
          >
            {l}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}

function PathArc({ fromMs, toMs, stepMs, pick, color, offsetHours }: {
  fromMs: number; toMs: number; stepMs: number; pick: "sun" | "earth"; color: string; offsetHours: number;
}) {
  const data = useMissionStore((s) => s.data)!;
  const { points, colors } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const cols: [number, number, number][] = [];
    const ok = new THREE.Color(color), bad = new THREE.Color(COLORS.danger).multiplyScalar(0.8);
    for (let t = fromMs; t <= toMs; t += stepMs) {
      const b = sampleOrbital(data.timeline, t)[pick];
      const blocked = b.el <= maskHorizonAt(data.mask, data.maskStep, b.az);
      pts.push(skyPoint(b.az, b.el, DOME_R - 0.05));
      const c = blocked ? bad : ok;
      cols.push([c.r, c.g, c.b]);
    }
    return { points: pts, colors: cols };
  }, [data, fromMs, toMs, stepMs, pick, color]);
  void offsetHours;
  if (points.length < 2) return null;
  return <Line points={points} vertexColors={colors} lineWidth={2.4} transparent opacity={0.9} />;
}

function ImpactMarker({ pos }: { pos: THREE.Vector3 }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const blink = 0.55 + 0.45 * Math.sin(t * 7);
    const pulse = 1 + 0.45 * Math.sin(t * 7);
    if (ringRef.current) {
      ringRef.current.scale.setScalar(pulse);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = blink;
    }
    if (coreRef.current) {
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * Math.sin(t * 7);
    }
  });
  return (
    <group position={pos}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color="#ff2a3c" transparent />
      </mesh>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.28, 0.44, 32]} />
        <meshBasicMaterial color="#ff4d5a" transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CelestialBody({
  kind,
  body,
  blocked,
  impactKm,
  siteOrigin,
  badge,
  ghost = false,
}: {
  kind: "sun" | "earth";
  body: AzEl;
  blocked: boolean;
  impactKm?: number | null;
  siteOrigin: THREE.Vector3;
  badge: string;
  ghost?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const p = useMemo(() => skyPoint(body.az, body.el, DOME_R + 2).add(siteOrigin), [body.az, body.el, siteOrigin]);
  const baseColor = kind === "sun" ? COLORS.sun : COLORS.earth;
  const c = blocked ? COLORS.danger : baseColor;
  const sunMap = useMemo(() => (kind === "sun" ? getSunTexture() : null), [kind]);
  const sunCoronaMap = useMemo(() => (kind === "sun" ? getSunCoronaTexture() : null), [kind]);
  const earthMap = useMemo(() => (kind === "earth" ? getEarthTexture() : null), [kind]);

  const impactPos = useMemo(() => {
    if (!impactKm) return null;
    const az = THREE.MathUtils.degToRad(body.az);
    const el = THREE.MathUtils.degToRad(exaggerateEl(body.el));
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    return siteOrigin.clone().addScaledVector(dir, impactKm);
  }, [impactKm, body.az, body.el, siteOrigin]);

  useFrame((_, dt) => {
    if (meshRef.current && !ghost) {
      meshRef.current.rotation.y += dt * (kind === "earth" ? 0.18 : 0.08);
    }
  });

  return (
    <group>
      {!ghost && (
        <Line
          points={[siteOrigin, impactPos ?? p]}
          color={c}
          lineWidth={impactPos ? 2 : 1.2}
          dashed={false}
          transparent
          opacity={impactPos ? 0.95 : 0.55}
        />
      )}
      {!ghost && impactPos && <ImpactMarker pos={impactPos} />}

      {ghost ? (
        <mesh position={p}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial color={c} transparent opacity={0.55} wireframe />
        </mesh>
      ) : kind === "sun" ? (
        <group position={p}>
          {/* Blinding white-hot solar photosphere */}
          <mesh ref={meshRef}>
            <sphereGeometry args={[0.42, 28, 28]} />
            <meshBasicMaterial map={sunMap} color={blocked ? "#ffd2c2" : "#fffcf0"} />
          </mesh>
          {/* Smooth billboarded corona + diffraction spikes */}
          <sprite scale={[3.8, 3.8, 1]}>
            <spriteMaterial
              map={sunCoronaMap}
              color={blocked ? "#ff6b6b" : "#ffe6a3"}
              transparent
              opacity={blocked ? 0.55 : 0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </group>
      ) : (
        <group position={p}>
          <mesh ref={meshRef} rotation-z={0.41}>
            <sphereGeometry args={[0.52, 28, 28]} />
            <meshStandardMaterial
              map={earthMap}
              emissive={blocked ? "#4a0b12" : "#0b2545"}
              emissiveIntensity={0.45}
              roughness={0.65}
            />
          </mesh>
          {/* Atmospheric Fresnel-like rim */}
          <mesh>
            <sphereGeometry args={[0.62, 24, 24]} />
            <meshBasicMaterial
              color={blocked ? COLORS.danger : "#5bc0ff"}
              transparent
              opacity={blocked ? 0.22 : 0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      <Billboard position={[p.x, p.y + (ghost ? 1.0 : 1.15), p.z]}>
        <Text
          fontSize={0.62}
          color={c}
          fillOpacity={ghost ? 0.8 : 1}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {badge}
        </Text>
      </Billboard>
    </group>
  );
}

function LandmarkPins({ terrain }: { terrain: TerrainMatrix }) {
  const selectedId = useMissionStore((s) => s.selectedLandmarkId);
  const setSelectedId = useMissionStore((s) => s.setSelectedLandmarkId);

  const items = useMemo(
    () =>
      LUNAR_LANDMARKS.map((lm) => {
        const hRaw = sampleHeight(terrain, lm.xKm * 1000, lm.yKm * 1000);
        const y = ((Number.isNaN(hRaw) ? 0 : hRaw) / 1000) * VERT_EXAG;
        return { ...lm, y };
      }),
    [terrain],
  );

  return (
    <group>
      {items.map((lm) => {
        const active = selectedId === lm.id;
        return (
          <group key={lm.id} position={[lm.xKm, lm.y, -lm.yKm]}>
            <Line
              points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.25, 0)]}
              color={active ? "#ffffff" : "#a3a3a3"}
              lineWidth={1}
              transparent
              opacity={active ? 0.9 : 0.45}
            />
            <Billboard position={[0, 1.45, 0]}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(active ? null : lm.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "auto";
                }}
              >
                <circleGeometry args={[0.42, 32]} />
                <meshBasicMaterial color={active ? "#ffffff" : "#161618"} transparent opacity={0.92} />
              </mesh>
              <mesh position={[0, 0, 0.005]}>
                <ringGeometry args={[0.41, 0.47, 32]} />
                <meshBasicMaterial color={active ? "#ffffff" : "#a3a3a3"} />
              </mesh>
              <Text
                position={[0, 0, 0.01]}
                fontSize={0.48}
                fontWeight={700}
                color={active ? "#0a0a0a" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
              >
                ?
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

function SiteMarker() {
  const lang = useMissionStore((s) => s.lang);
  return (
    <group>
      <Line points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.8, 0)]} color="#ffffff" lineWidth={1.5} />
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[0.35, 0.45, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <Billboard position={[0, 1.15, 0]}>
        <Text fontSize={0.36} color="#ffffff" anchorX="center" anchorY="bottom" outlineWidth={0.03} outlineColor="#000000">
          {lang === "en" ? "LANDING SITE" : "SITIO DE ATERRIZAJE"}
        </Text>
      </Billboard>
    </group>
  );
}

function CameraGuard({
  controlsRef,
  isolatePole,
  siteTarget,
  syncId,
  applyingSyncRef,
}: {
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
  isolatePole: boolean;
  siteTarget: [number, number, number];
  syncId: string;
  applyingSyncRef: React.MutableRefObject<boolean>;
}) {
  const keys = useRef<Record<string, boolean>>({});
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const delta = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();
  const centerTrigger = useMissionStore((s) => s.centerTrigger);
  const prevTrigger = useRef(centerTrigger);

  // Sync camera pose from other viewports (Compare Mode)
  useEffect(() => {
    const onSync = (msg: CameraSyncMsg) => {
      if (msg.sourceId === syncId) return;
      const ctrl = controlsRef.current;
      if (!ctrl) return;
      applyingSyncRef.current = true;
      camera.position.set(msg.pos[0], msg.pos[1], msg.pos[2]);
      ctrl.target.set(msg.target[0], msg.target[1], msg.target[2]);
      ctrl.update();
      applyingSyncRef.current = false;
    };
    cameraSyncListeners.add(onSync);
    if (lastSyncedCamera && lastSyncedCamera.sourceId !== syncId) {
      onSync(lastSyncedCamera);
    }
    return () => {
      cameraSyncListeners.delete(onSync);
    };
  }, [syncId, controlsRef, camera, applyingSyncRef]);

  useEffect(() => {
    if (centerTrigger === prevTrigger.current) return;
    prevTrigger.current = centerTrigger;
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const [tx, ty, tz] = siteTarget;
    ctrl.target.set(tx, ty, tz);
    camera.position.set(tx, ty + 13.5, tz + 28);
    ctrl.update();
  }, [centerTrigger, controlsRef, camera, siteTarget]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        keys.current[e.key] = true;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useFrame((_, dt) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const k = keys.current;
    const fb = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
    const lr = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0);
    if (fb || lr) {
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
      fwd.normalize();
      right.crossVectors(fwd, camera.up).normalize();

      const speed = 18 * dt;
      delta.set(0, 0, 0).addScaledVector(fwd, fb * speed).addScaledVector(right, lr * speed);
      camera.position.add(delta);
      ctrl.target.add(delta);
    }

    // Clamp target within the South Pole boundary so the user never loses the site
    const maxPan = isolatePole ? 15 : 28;
    const r = Math.hypot(ctrl.target.x, ctrl.target.z);
    let clamped = false;
    if (r > maxPan) {
      const scale = maxPan / r;
      const nx = ctrl.target.x * scale;
      const nz = ctrl.target.z * scale;
      camera.position.x += nx - ctrl.target.x;
      camera.position.z += nz - ctrl.target.z;
      ctrl.target.x = nx;
      ctrl.target.z = nz;
      clamped = true;
    }
    if (ctrl.target.y < -2 || ctrl.target.y > 8) {
      const ny = Math.min(Math.max(ctrl.target.y, -2), 8);
      camera.position.y += ny - ctrl.target.y;
      ctrl.target.y = ny;
      clamped = true;
    }
    if (fb || lr || clamped) {
      ctrl.update();
    }
  });

  return null;
}

function Scene({ offsetHours, ghostOffsetHours }: { offsetHours: number; ghostOffsetHours?: number }) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const applyingSyncRef = useRef(false);
  const syncId = useId();
  const data = useMissionStore((s) => s.data)!;
  const isolatePole = useMissionStore((s) => s.isolatePole);
  const terrainBrightness = useMissionStore((s) => s.terrainBrightness);
  const lang = useMissionStore((s) => s.lang);
  const landingSite = useMissionStore((s) => s.landingSite);
  const vehicleId = useMissionStore((s) => s.vehicleId);
  const veh = findVehicle(vehicleId);
  const sc = useScenario(offsetHours)!;
  const ghost = useScenario(ghostOffsetHours ?? offsetHours);
  const siteY = (landingSite.elevationM / 1000) * VERT_EXAG;
  const siteOrigin = useMemo(() => new THREE.Vector3(landingSite.x, siteY + 0.05, -landingSite.y), [landingSite.x, landingSite.y, siteY]);
  const occOpts = useMemo(
    () => ({ observerX: landingSite.x * 1000, observerY: landingSite.y * 1000, observerHeight: veh.heightM }),
    [landingSite.x, landingSite.y, veh.heightM],
  );
  const sunPos = skyPoint(sc.sun.az, sc.sun.el, 40);
  const earthPos = skyPoint(sc.earth.az, sc.earth.el, 40);
  const sunImpactKm = useMemo(() => {
    const m = findImpactDistance(data.terrain, sc.sun, occOpts);
    return m !== null ? m / 1000 : null;
  }, [data.terrain, sc.sun, occOpts]);
  const earthImpactKm = useMemo(() => {
    const m = findImpactDistance(data.terrain, sc.earth, occOpts);
    return m !== null ? m / 1000 : null;
  }, [data.terrain, sc.earth, occOpts]);
  const t = sc.timeMs;
  const step = 2 * H;

  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      {!isolatePole && <fog attach="fog" args={["#0a0a0a", 34, 78]} />}
      <ambientLight intensity={0.18 * terrainBrightness} color="#d4d4d4" />
      <hemisphereLight args={["#e5e5e5", "#0a0a0a", 0.25 * terrainBrightness]} />
      <directionalLight
        position={sunPos}
        intensity={(sc.occ.sun ? 0.6 : 2.4) * Math.max(0.6, terrainBrightness * 0.85)}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
      />
      <directionalLight position={earthPos} intensity={0.25} color={COLORS.earth} />

      <Terrain terrain={data.terrain} contextTerrain={data.contextTerrain} />
      <SkyDome mask={data.mask} maskStep={data.maskStep} />
      <LandmarkPins terrain={data.terrain} />
      <group position={[landingSite.x, siteY, -landingSite.y]}>
        <SiteMarker />
      </group>

      <group position={[landingSite.x, siteY, -landingSite.y]}>
        <PathArc fromMs={t - 36 * H} toMs={t + 6 * 24 * H} stepMs={step} pick="sun" color={COLORS.sun} offsetHours={offsetHours} />
        <PathArc fromMs={t - 3 * 24 * H} toMs={t + 10 * 24 * H} stepMs={step} pick="earth" color={COLORS.earth} offsetHours={offsetHours} />
      </group>

      <CelestialBody
        kind="sun"
        body={sc.sun}
        blocked={sc.occ.sun}
        impactKm={sunImpactKm}
        siteOrigin={siteOrigin}
        badge={`☉ ${sc.sun.el.toFixed(1)}° ${sc.occ.sun ? (lang === "en" ? "OCCLUDED" : "OCULTO") : ""}`.trim()}
      />
      <CelestialBody
        kind="earth"
        body={sc.earth}
        blocked={sc.occ.earth}
        impactKm={earthImpactKm}
        siteOrigin={siteOrigin}
        badge={`⊕ ${sc.occ.earth ? "OFF" : "ON"}`}
      />

      {ghostOffsetHours !== undefined && ghost && (
        <>
          <CelestialBody ghost kind="sun" body={ghost.sun} blocked={ghost.occ.sun} siteOrigin={siteOrigin} badge={`☉ +${ghostOffsetHours - offsetHours}h`} />
          <CelestialBody ghost kind="earth" body={ghost.earth} blocked={ghost.occ.earth} siteOrigin={siteOrigin} badge={`⊕ +${ghostOffsetHours - offsetHours}h`} />
        </>
      )}

      <CameraGuard
        controlsRef={controlsRef}
        isolatePole={isolatePole}
        siteTarget={[landingSite.x, siteY + 0.5, -landingSite.y]}
        syncId={syncId}
        applyingSyncRef={applyingSyncRef}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan
        screenSpacePanning={false}
        enableDamping
        target={[0, 0.5, 0]}
        minDistance={8}
        maxDistance={isolatePole ? 36 : 48}
        maxPolarAngle={Math.PI / 2.02}
        onChange={() => {
          if (applyingSyncRef.current) return;
          const ctrl = controlsRef.current;
          if (!ctrl) return;
          const msg: CameraSyncMsg = {
            sourceId: syncId,
            pos: [ctrl.object.position.x, ctrl.object.position.y, ctrl.object.position.z],
            target: [ctrl.target.x, ctrl.target.y, ctrl.target.z],
          };
          lastSyncedCamera = msg;
          cameraSyncListeners.forEach((fn) => fn(msg));
        }}
      />
    </>
  );
}

export default function HorizonScene(props: { offsetHours: number; ghostOffsetHours?: number }) {
  return (
    <Canvas shadows camera={{ position: [0, 14, 29], fov: 44, near: 0.05, far: 400 }} dpr={[1, 2]} className="!absolute inset-0">
      <Scene {...props} />
    </Canvas>
  );
}

export type { ScenarioState };
export { exaggerateEl };
