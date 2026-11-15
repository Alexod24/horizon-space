"use client";

import { useMissionStore } from "@/store/useMissionStore";

const HERO_STATS = [
  { val: "69,985", label: "Muestras JPL" },
  { val: "15 KM", label: "Radio LOLA" },
  { val: "±1.9°", label: "Ángulo Solar" },
  { val: "+48H", label: "Crisis Retraso" },
];

const STEPS = [
  {
    num: "01",
    pct: "25%",
    title: "Marca el Sitio",
    desc: "Haz clic en cualquier punto dentro de los 15 km del cráter Shackleton para fijar el aterrizaje.",
  },
  {
    num: "02",
    pct: "50%",
    title: "Equipo y Fecha",
    desc: "Elige un módulo real (VIPER, Athena, Vikram, LTV) y la fecha/hora UTC de lanzamiento.",
  },
  {
    num: "03",
    pct: "75%",
    title: "Simula el Retraso",
    desc: "Compara lado a lado el escenario nominal (T+0h) frente a un retraso de +24h, +48h o +72h.",
  },
  {
    num: "04",
    pct: "100%",
    title: "Evalúa Oclusión",
    desc: "Detecta en 3D si las crestas bloquean al Sol o a la Tierra antes de comprometer la misión.",
  },
];

const FUTURE_FEATURES = [
  {
    title: "Múltiples Sitios Polares",
    desc: "Expansión del motor de oclusión hacia Malapert Massif, Nobile Rim y el cráter Amundsen con tiles LOLA de 5 m/px.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-white">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 0 0 18M12 3a14 14 0 0 1 0 18" />
      </svg>
    ),
  },
  {
    title: "Rutas de Rover 3D",
    desc: "Planificación de trayectorias dinámicas para rovers siguiendo crestas de iluminación continua y evitando sombras letales.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-white">
        <path d="M4 17l5-5 4 3 7-8" />
        <circle cx="4" cy="17" r="1.5" />
        <circle cx="20" cy="7" r="1.5" />
        <path d="M16 7h4v4" />
      </svg>
    ),
  },
  {
    title: "Enlace LRO / DSN en Vivo",
    desc: "Integración automática con efemérides diarias de la Red de Espacio Profundo (DSN) y carga de archivos GeoTIFF propios.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-white">
        <path d="M4.5 16.5a10 10 0 0 1 15 0M7.5 19a6 6 0 0 1 9 0" />
        <circle cx="12" cy="20" r="1" fill="currentColor" />
        <path d="M12 12V4m0 0-3 3m3-3 3 3" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const status = useMissionStore((s) => s.status);
  const setEnteredApp = useMissionStore((s) => s.setEnteredApp);

  return (
    <div className="min-h-dvh scroll-smooth bg-[#0a0a0a] text-neutral-100 lg:h-dvh lg:overflow-y-auto">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-[#0a0a0a]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.jpg"
              alt="Horizon Space"
              className="h-7 w-7 rounded border border-neutral-800 object-cover"
            />
            <span className="font-semibold tracking-[0.18em] text-white">HORIZON SPACE</span>
          </div>

          <nav className="hidden items-center gap-7 text-[11px] font-medium tracking-wider text-neutral-400 md:flex">
            <a href="#reto" className="transition hover:text-white">El Reto</a>
            <a href="#solucion" className="transition hover:text-white">Solución y Pasos</a>
            <a href="#futuro" className="transition hover:text-white">Futuras Features</a>
            <span className="font-mono text-[10px] text-neutral-500">SPACE APPS 2026</span>
          </nav>

          <button
            type="button"
            onClick={() => setEnteredApp(true)}
            className="rounded-full bg-white px-4 py-1.5 text-[11px] font-bold tracking-wider text-black transition hover:bg-neutral-200"
          >
            {status === "loading" ? "Cargando..." : "Abrir Simulador"}
          </button>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden border-b border-neutral-900">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/hero-moon.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/50" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-14 pt-16 sm:pt-24">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-neutral-300 backdrop-blur-sm">
              NASA SPACE APPS CHALLENGE · POLO SUR LUNAR
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Horizon Space
              <span className="mt-1 block text-2xl font-normal text-neutral-300 sm:text-3xl">
                Navigator de Sitios de Aterrizaje Lunar
              </span>
            </h1>

            {/* 4 Telemetry Stat Boxes (mirrors countdown grid in reference) */}
            <div className="mt-7 grid grid-cols-4 gap-2.5 sm:max-w-md">
              {HERO_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-md border border-white/15 bg-black/70 px-2.5 py-3 text-center backdrop-blur-sm"
                >
                  <div className="font-mono text-base font-bold text-white sm:text-lg">{s.val}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-wider text-neutral-400">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setEnteredApp(true)}
                className="rounded-full bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-black shadow-[0_0_30px_rgba(255,255,255,0.25)] transition hover:bg-neutral-200"
              >
                {status === "loading" ? "CARGANDO DATOS NASA..." : "PLANIFICAR MISIÓN →"}
              </button>
              <a
                href="#reto"
                className="rounded-full border border-white/25 bg-black/50 px-6 py-2.5 text-xs font-medium text-neutral-200 backdrop-blur-sm transition hover:border-white/50 hover:text-white"
              >
                Conocer el Reto
              </a>
            </div>
          </div>

          {/* Bottom Hero Progress / Mission Window Strip */}
          <div className="mt-14 rounded-md border border-white/10 bg-black/70 p-4 backdrop-blur-md">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-neutral-400">
              <span>VENTANA DE EFEMÉRIDES REALES (JPL HORIZONS DE441)</span>
              <span className="text-white">SHACKLETON RIM · 89.87°S, 296.36°E</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full w-2/3 rounded-full bg-white" />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-neutral-500">
              <span>2026-01-01 UTC</span>
              <span>PASO: 15 MIN · RADIO: 15 KM</span>
              <span>2027-12-31 UTC</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: EL RETO (borderless floating visual like reference) */}
      <section id="reto" className="relative overflow-hidden border-b border-neutral-900 bg-[#080808] py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          {/* Left Floating Visual — no outer card box */}
          <div className="relative flex h-80 items-center justify-center">
            {/* Subtle atmospheric lunar rim glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_40%,transparent_70%)]" />

            <img
              src="/vehicles/nova-c.jpg"
              alt="Módulo lunar en sombra del Polo Sur"
              className="relative z-10 h-72 w-72 object-contain brightness-95 contrast-110 [mask-image:radial-gradient(closest-side,black_58%,transparent_100%)]"
            />

            {/* Floating minimal telemetry callouts */}
            <div className="pointer-events-none absolute left-2 top-6 z-20 font-mono text-[10px] tracking-wider text-neutral-400">
              <div className="text-neutral-500">ELEVACIÓN SOLAR</div>
              <div className="text-xs font-semibold text-white">±1.9° HORIZONTE</div>
            </div>

            <div className="pointer-events-none absolute bottom-6 left-2 z-20 font-mono text-[10px] tracking-wider text-neutral-400">
              <div className="text-neutral-500">SOMBRA SHACKLETON</div>
              <div className="text-xs font-semibold text-white">&gt; 40 KM ALCANCE</div>
            </div>

            <div className="pointer-events-none absolute bottom-6 right-2 z-20">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/50 px-3 py-1 font-mono text-[10px] text-rose-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                RIESGO DE CONGELAMIENTO
              </span>
            </div>
          </div>

          {/* Right Narrative */}
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <span className="font-mono text-neutral-500">&rsaquo;</span>
              <h2>El Reto: La Crisis de los Retrasos</h2>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-neutral-400">
              En el Polo Sur Lunar, el Sol y la Tierra apenas se elevan sobre el horizonte (±1.9° solar). Las crestas de cráteres como Shackleton proyectan sombras de decenas de kilómetros.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Si un lanzamiento se retrasa <strong className="text-white">24, 48 o 72 horas</strong>, la geometría orbital cambia: un punto que era seguro puede quedar atrapado en oscuridad permanente o sin línea de visión directa con la Tierra, congelando el rover en horas.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEnteredApp(true)}
                className="rounded-full bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-black shadow-[0_0_24px_rgba(255,255,255,0.18)] transition hover:bg-neutral-200"
              >
                Probar Simulador
              </button>
              <a
                href="#solucion"
                className="rounded-full border border-neutral-700 px-6 py-2.5 text-xs font-medium text-neutral-300 transition hover:border-white/50 hover:text-white"
              >
                Ver Solución
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LA SOLUCIÓN & PASOS DE CÓMO USAR (continuous segmented bar like reference) */}
      <section id="solucion" className="border-b border-neutral-900 bg-[#080808] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <span className="font-mono text-neutral-500">&rsaquo;</span>
            <h2>La Solución: Simulación en 4 Pasos</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Motor de pre-computación estática sin latencia que cruza topografía real LOLA DEM con efemérides JPL Horizons para validar en milisegundos si un sitio sobrevive al retraso.
          </p>

          {/* Step Headers */}
          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STEPS.map((st) => (
              <div key={st.num} className="flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold tracking-tight text-white">PASO {st.num}</span>
                <span className="text-[11px] text-neutral-500">{st.pct}</span>
              </div>
            ))}
          </div>

          {/* Continuous Segmented Progress Bar */}
          <div className="mt-3 grid h-2.5 w-full grid-cols-4 gap-1 overflow-hidden rounded-full bg-neutral-900 p-0.5">
            {STEPS.map((st, idx) => (
              <div
                key={st.num}
                className="h-full rounded-full bg-white transition-opacity"
                style={{ opacity: 0.25 + idx * 0.25 }}
              />
            ))}
          </div>

          {/* Borderless Step Descriptions */}
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st) => (
              <div key={st.num} className="border-l border-neutral-800/80 pl-4">
                <h3 className="text-sm font-semibold text-white">{st.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-400">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FUTURAS FEATURES (borderless floating over glowing lunar limb) */}
      <section id="futuro" className="relative overflow-hidden border-b border-neutral-900 bg-[#080808] pb-24 pt-20">
        {/* Heading ABOVE the horizon */}
        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <div className="mb-2 flex justify-center text-neutral-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Futuras Funcionalidades
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-neutral-400">
            Arquitectura modular preparada para escalar hacia operaciones completas de navegación y supervivencia en la era Artemis.
          </p>
        </div>

        {/* Glowing curved lunar horizon */}
        <div className="relative mt-8 pt-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden">
            <img
              src="/hero-moon.jpg"
              alt=""
              className="h-full w-full object-cover object-top opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
            {FUTURE_FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center opacity-90">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-400">{f.desc}</p>
                <button
                  type="button"
                  onClick={() => setEnteredApp(true)}
                  className="mt-5 rounded-full border border-neutral-700 bg-black/50 px-5 py-1.5 text-[10px] font-medium text-neutral-200 transition hover:border-white hover:text-white"
                >
                  Probar Base →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050505] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-6 text-xs text-neutral-500 md:flex-row">
          {/* Left: Horizon Space Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/icon.jpg"
              alt="Horizon Space"
              className="h-8 w-8 rounded border border-neutral-800 object-cover"
            />
            <div>
              <div className="font-semibold tracking-[0.18em] text-white">HORIZON SPACE</div>
              <div className="font-mono text-[10px] text-neutral-500">
                SHACKLETON RIM · 89.87°S, 296.36°E
              </div>
            </div>
          </div>

          {/* Center: Official NASA Space Apps Challenge Emblem */}
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 215 190"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-auto shrink-0"
              aria-label="NASA Space Apps Challenge"
            >
              {/* Top orbital arc */}
              <path
                d="M 38.2 77 A 72 72 0 0 1 171.8 77"
                stroke="#FFFFFF"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              {/* Bottom orbital arc */}
              <path
                d="M 170.8 133.3 A 72 72 0 0 1 39.2 133.3"
                stroke="#FFFFFF"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              {/* Sputnik 4 antennas */}
              <line x1="150" y1="42" x2="165" y2="15" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />
              <line x1="158" y1="43" x2="171" y2="26" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
              <line x1="164" y1="48" x2="181" y2="34" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
              <line x1="166" y1="56" x2="193" y2="42" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />
              {/* Sputnik body */}
              <circle cx="155.9" cy="53.1" r="11.5" fill="#050505" stroke="#FFFFFF" strokeWidth="4.2" />

              {/* NASA */}
              <text
                x="105"
                y="74"
                textAnchor="middle"
                fill="#E03C31"
                fontSize="14.5"
                fontWeight="800"
                letterSpacing="5"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                NASA
              </text>
              {/* SPACE APPS (condensed) */}
              <g transform="translate(105, 110) scale(0.78, 1.18)">
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="35"
                  fontWeight="800"
                  letterSpacing="0.8"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  SPACE APPS
                </text>
              </g>
              {/* CHALLENGE */}
              <text
                x="105"
                y="129"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="12.5"
                fontWeight="700"
                letterSpacing="4.6"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                CHALLENGE
              </text>
            </svg>
          </div>

          {/* Right: Data Credits & CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[10px]">
            <span>LOLA DEM</span>
            <span>·</span>
            <span>JPL Horizons DE441</span>
            <button
              type="button"
              onClick={() => setEnteredApp(true)}
              className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 font-sans text-[11px] font-medium text-white transition hover:border-white hover:bg-white hover:text-black"
            >
              Iniciar Simulación →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
