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
    tag: "FASE II",
    title: "Múltiples Sitios Polares",
    desc: "Expansión del motor de oclusión hacia Malapert Massif, Nobile Rim y el cráter Amundsen con tiles LOLA de 5 m/px.",
  },
  {
    tag: "FASE III",
    title: "Rutas de Rover 3D",
    desc: "Planificación de trayectorias dinámicas para rovers siguiendo crestas de iluminación continua y evitando sombras letales.",
  },
  {
    tag: "FASE IV",
    title: "Enlace LRO / DSN en Vivo",
    desc: "Integración automática con efemérides diarias de la Red de Espacio Profundo (DSN) y carga de archivos GeoTIFF propios.",
  },
];

export default function LandingPage() {
  const status = useMissionStore((s) => s.status);
  const setEnteredApp = useMissionStore((s) => s.setEnteredApp);

  return (
    <div className="h-dvh overflow-y-auto scroll-smooth bg-[#0a0a0a] text-neutral-100">
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

      {/* SECTION 2: EL RETO (replaces "What Do We Do?") */}
      <section id="reto" className="border-b border-neutral-900 bg-[#0d0d0d] py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          {/* Left Visual */}
          <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-[#111111] p-4">
            <div className="relative flex h-64 items-center justify-center overflow-hidden rounded bg-[#0a0a0a]">
              <img
                src="/vehicles/nova-c.jpg"
                alt="Módulo lunar en sombra del Polo Sur"
                className="h-full w-full object-contain p-4"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] text-neutral-300">
                <span>SIMULACIÓN DE SOMBRA LUNAR</span>
                <span className="rounded border border-rose-500/50 bg-rose-950/60 px-2 py-0.5 text-rose-300">
                  RIESGO DE CONGELAMIENTO
                </span>
              </div>
            </div>
          </div>

          {/* Right Narrative */}
          <div>
            <div className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <span className="font-mono text-neutral-500">&rsaquo;</span>
              <h2>El Reto: La Crisis de los Retrasos</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              En el Polo Sur Lunar, el Sol y la Tierra apenas se elevan sobre el horizonte (±1.9° solar). Las crestas de cráteres como Shackleton proyectan sombras de decenas de kilómetros.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Si un lanzamiento se retrasa <strong className="text-white">24, 48 o 72 horas</strong>, la geometría orbital cambia: un punto que era seguro puede quedar atrapado en oscuridad permanente o sin línea de visión directa con la Tierra, congelando el rover en horas.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEnteredApp(true)}
                className="rounded-full bg-white px-6 py-2 text-xs font-bold tracking-wider text-black transition hover:bg-neutral-200"
              >
                Probar Simulador
              </button>
              <a
                href="#solucion"
                className="rounded-full border border-neutral-700 px-6 py-2 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
              >
                Ver Solución
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LA SOLUCIÓN & PASOS DE CÓMO USAR (replaces horizontal 4-step bar) */}
      <section id="solucion" className="border-b border-neutral-900 bg-[#0a0a0a] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
            <span className="font-mono text-neutral-500">&rsaquo;</span>
            <h2>La Solución: Simulación Táctica en 4 Pasos</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Un motor de pre-computación estática sin latencia que cruza topografía real LOLA DEM con efemérides de JPL Horizons para responder en milisegundos si un sitio sobrevive al retraso.
          </p>

          {/* Segmented Monochrome Bar */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st, idx) => (
              <div key={st.num} className="flex flex-col">
                <div className="mb-2 flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-white">PASO {st.num}</span>
                  <span className="text-[10px] text-neutral-500">{st.pct}</span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-neutral-900">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ opacity: 0.35 + idx * 0.22 }}
                  />
                </div>
                <div className="flex-1 rounded-md border border-neutral-800 bg-[#141414] p-4">
                  <h3 className="text-xs font-semibold text-white">{st.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FUTURAS FEATURES (mirrors Features over curved horizon) */}
      <section id="futuro" className="relative overflow-hidden border-b border-neutral-900 bg-[#0d0d0d] py-20">
        {/* Subtle curved horizon arc behind cards */}
        <div
          className="pointer-events-none absolute left-1/2 top-24 h-[900px] w-[1400px] -translate-x-1/2 rounded-full border-t border-white/25"
          style={{
            boxShadow: "0 -12px 60px -15px rgba(255,255,255,0.18)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="text-center">
            <div className="font-mono text-[10px] tracking-[0.25em] text-neutral-500">ROADMAP</div>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Futuras Funcionalidades</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-400">
              Arquitectura modular lista para escalar hacia operaciones completas de la era Artemis.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {FUTURE_FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col justify-between rounded-lg border border-neutral-800 bg-[#121212]/90 p-6 backdrop-blur-sm transition hover:border-neutral-600"
              >
                <div>
                  <span className="inline-block rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-mono text-[9px] tracking-widest text-neutral-300">
                    {f.tag}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-400">{f.desc}</p>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setEnteredApp(true)}
                    className="rounded-full border border-neutral-700 px-4 py-1 text-[10px] font-medium text-neutral-300 transition hover:border-white hover:text-white"
                  >
                    Probar Base Actual →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#080808] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-neutral-500 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.jpg"
              alt="Horizon Space"
              className="h-6 w-6 rounded border border-neutral-800 object-cover"
            />
            <span className="font-semibold tracking-wider text-neutral-200">HORIZON SPACE</span>
            <span className="text-neutral-600">·</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px]">
            <span>LOLA DEM (Shackleton Rim)</span>
            <span>·</span>
            <span>JPL Horizons DE441</span>
            <button
              type="button"
              onClick={() => setEnteredApp(true)}
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1 font-sans text-[11px] font-medium text-white transition hover:border-white"
            >
              Iniciar Simulación →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
