"use client";

import LangToggle from "@/components/hud/LangToggle";
import { useMissionStore } from "@/store/useMissionStore";

const HERO_PILLARS = [
  {
    img: "/sun.jpg",
    titleEs: "Luz del Sol",
    titleEn: "Sunlight",
    descEs: "Energía y calor para que la nave no se congele",
    descEn: "Power and warmth so the lander doesn't freeze",
  },
  {
    img: "/earth.jpg",
    titleEs: "Señal con la Tierra",
    titleEn: "Earth Signal",
    descEs: "Contacto directo sin montañas en medio",
    descEn: "Direct contact without mountains in the way",
  },
];

const STEPS = [
  {
    num: "01",
    pct: "Paso 1",
    titleEs: "Elige dónde aterrizar",
    titleEn: "Pick a Landing Spot",
    descEs: "Haz clic sobre el cráter lunar en 3D para marcar el punto donde quieres enviar tu misión.",
    descEn: "Click anywhere on the 3D lunar crater to mark where you want your mission to land.",
  },
  {
    num: "02",
    pct: "Paso 2",
    titleEs: "Elige tu nave y fecha",
    titleEn: "Choose Craft & Date",
    descEs: "Selecciona un vehículo lunar real y el día de despegue desde la Tierra.",
    descEn: "Select a real lunar vehicle and the launch date from Earth.",
  },
  {
    num: "03",
    pct: "Paso 3",
    titleEs: "¿Y si el cohete se atrasa?",
    titleEn: "What if Launch Delays?",
    descEs: "Compara qué pasa si despegas a tiempo frente a un retraso de 24, 48 o 72 horas.",
    descEn: "Compare an on-time launch against a 24, 48, or 72-hour delay.",
  },
  {
    num: "04",
    pct: "Paso 4",
    titleEs: "Descubre si es seguro",
    titleEn: "See if It's Safe",
    descEs: "Verifica con un simple check (✓) si tendrás luz del Sol y señal con la Tierra durante 7 días.",
    descEn: "Check at a glance (✓) whether you'll have sunlight and Earth signal for 7 days.",
  },
];

const AUDIENCE_LEVELS = [
  {
    badgeEs: "MODO SIMPLE (POR DEFECTO)",
    badgeEn: "SIMPLE MODE (DEFAULT)",
    titleEs: "Educadores, Estudiantes y Público General",
    titleEn: "Educators, Students & General Public",
    descEs:
      "Comprende de forma visual e intuitiva por qué el Polo Sur de la Luna es tan extremo. Indicadores claros del Sol y la Tierra con un simple check (✓) muestran al instante si la misión sobrevive.",
    descEn:
      "Understand visually and intuitively why the Lunar South Pole is so extreme. Clear Sun and Earth indicators with a simple check (✓) show instantly whether the mission survives.",
  },
  {
    badgeEs: "MODO AVANZADO (1 CLIC)",
    badgeEn: "ADVANCED MODE (1 CLICK)",
    titleEs: "Planificadores e Ingenieros de Misión",
    titleEn: "Mission Planners & Flight Directors",
    descEs:
      "Activa el panel de opciones avanzadas para consultar porcentajes de viabilidad, tiempos de tránsito (7d, 14d, 45d), ángulos solares, límites de batería y recomendación automática de fechas óptimas.",
    descEn:
      "Enable Advanced Options to inspect viability scores, transit profiles (7d, 14d, 45d), solar angles, battery limits, and automated optimal launch window recommendations.",
  },
];

export default function LandingPage() {
  const status = useMissionStore((s) => s.status);
  const setEnteredApp = useMissionStore((s) => s.setEnteredApp);
  const lang = useMissionStore((s) => s.lang);
  const en = lang === "en";

  return (
    <div className="min-h-dvh scroll-smooth bg-[#0a0a0a] text-neutral-100 lg:h-dvh lg:overflow-y-auto">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-[#0a0a0a]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 text-xs sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.jpg"
              alt="Horizon Space"
              className="h-7 w-7 rounded border border-neutral-800 object-cover"
            />
            <span className="font-semibold tracking-[0.18em] text-white">HORIZON SPACE</span>
          </div>

          <nav className="hidden items-center gap-7 text-[11px] font-medium tracking-wider text-neutral-400 md:flex">
            <a href="#reto" className="transition hover:text-white">{en ? "Why the Moon?" : "¿Por qué es difícil?"}</a>
            <a href="#niveles" className="transition hover:text-white">{en ? "For Everyone" : "Para Todos"}</a>
            <a href="#solucion" className="transition hover:text-white">{en ? "How It Works" : "Cómo Funciona"}</a>
            <span className="font-mono text-[10px] text-neutral-500">SPACE APPS 2026</span>
          </nav>

          <div className="flex items-center gap-2.5">
            <LangToggle />
            <button
              type="button"
              onClick={() => setEnteredApp(true)}
              className="rounded-full bg-white px-4 py-1.5 text-[11px] font-bold tracking-wider text-black transition hover:bg-neutral-200"
            >
              {status === "loading"
                ? (en ? "Loading..." : "Cargando...")
                : (en ? "Open Simulator" : "Abrir Simulador")}
            </button>
          </div>
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

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-24">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-neutral-300 backdrop-blur-sm">
              {en ? "NASA SPACE APPS CHALLENGE · LUNAR SOUTH POLE" : "NASA SPACE APPS CHALLENGE · POLO SUR DE LA LUNA"}
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Horizon Space
              <span className="mt-1.5 block text-xl font-normal text-neutral-300 sm:text-2xl">
                {en
                  ? "Explore why landing on the Moon is a race against shadows"
                  : "Descubre por qué aterrizar en la Luna es una carrera contra las sombras"}
              </span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-neutral-300">
              {en
                ? "To survive on the Moon, a spacecraft needs two basic things: Sunlight for power and a clear view of Earth to communicate. Discover in 3D what happens when mountains get in the way."
                : "Para sobrevivir en la Luna, una nave necesita dos cosas básicas: luz del Sol para tener energía y ver a la Tierra para comunicarse. Explora en 3D qué pasa cuando las montañas lunares se interponen."}
            </p>

            {/* 2 Visual Pillars with Real Sun & Earth Images */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {HERO_PILLARS.map((p) => (
                <div
                  key={p.titleEs}
                  className="flex items-center gap-3 rounded-md border border-white/15 bg-black/70 p-3 backdrop-blur-sm"
                >
                  <img
                    src={p.img}
                    alt={en ? p.titleEn : p.titleEs}
                    className="h-10 w-10 shrink-0 rounded-full border border-white/20 object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{en ? p.titleEn : p.titleEs}</div>
                    <div className="text-[11px] leading-snug text-neutral-400">
                      {en ? p.descEn : p.descEs}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setEnteredApp(true)}
                className="rounded-full bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-black shadow-[0_0_30px_rgba(255,255,255,0.25)] transition hover:bg-neutral-200"
              >
                {status === "loading"
                  ? (en ? "LOADING SIMULATOR..." : "CARGANDO SIMULADOR...")
                  : (en ? "START EXPLORING →" : "EMPEZAR A EXPLORAR →")}
              </button>
              <a
                href="#reto"
                className="rounded-full border border-white/25 bg-black/50 px-6 py-2.5 text-xs font-medium text-neutral-200 backdrop-blur-sm transition hover:border-white/50 hover:text-white"
              >
                {en ? "How does it work?" : "¿Cómo funciona?"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: EL RETO EXPLICADO SIMPLE */}
      <section id="reto" className="relative overflow-hidden border-b border-neutral-900 bg-[#080808] py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          {/* Left Floating Visual */}
          <div className="relative flex h-72 items-center justify-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_40%,transparent_70%)]" />

            <img
              src="/vehicles/nova-c.jpg"
              alt={en ? "Lunar lander" : "Módulo lunar"}
              className="relative z-10 h-64 w-64 object-contain brightness-95 contrast-110 [mask-image:radial-gradient(closest-side,black_58%,transparent_100%)]"
            />
          </div>

          {/* Right Narrative */}
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <span className="font-mono text-neutral-500">&rsaquo;</span>
              <h2>{en ? "Why Does a Launch Delay Matter?" : "¿Por qué importa un retraso en el despegue?"}</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-neutral-300">
              {en
                ? "At the Moon's South Pole, the Sun never rises high in the sky—it skims the horizon. Because of this, craters and mountains cast giant shadows that move slowly as the days pass."
                : "En el Polo Sur de la Luna, el Sol nunca sube alto en el cielo: siempre está al ras del horizonte. Por eso, las montañas y cráteres proyectan sombras gigantescas que se mueven a medida que pasan los días."}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              {en ? (
                <>
                  If a rocket on Earth is delayed by just <strong className="text-white">1 or 2 days</strong>, the spacecraft arrives on the Moon on a different date—when its landing spot might already be covered by shadow or blocked from communicating with Earth.
                </>
              ) : (
                <>
                  Si el cohete en la Tierra se retrasa apenas <strong className="text-white">1 o 2 días</strong>, la nave llega a la Luna en una fecha distinta: un lugar que era soleado y seguro puede estar ahora en plena oscuridad o sin comunicación con la Tierra.
                </>
              )}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEnteredApp(true)}
                className="rounded-full bg-white px-7 py-2.5 text-xs font-bold tracking-wider text-black transition hover:bg-neutral-200"
              >
                {en ? "Try the Simulator" : "Probar el Simulador"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ACCESIBILIDAD PARA TODOS LOS NIVELES */}
      <section id="niveles" className="border-b border-neutral-900 bg-[#0a0a0a] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <span className="font-mono text-neutral-500">&rsaquo;</span>
              <h2>{en ? "Designed for Every Skill Level" : "Diseñado para Todos los Niveles"}</h2>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-neutral-400">
              {en
                ? "Switch seamlessly between an intuitive visual view for learning and a full technical console for mission planning."
                : "Cambia en cualquier momento entre una vista visual y sencilla para aprender, o una consola técnica completa para planificar misiones."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {AUDIENCE_LEVELS.map((lvl) => (
              <div
                key={lvl.titleEs}
                className="rounded-lg border border-neutral-800 bg-[#121212] p-6"
              >
                <span className="inline-block rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300">
                  {en ? lvl.badgeEn : lvl.badgeEs}
                </span>
                <h3 className="mt-3 text-base font-bold text-white">
                  {en ? lvl.titleEn : lvl.titleEs}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                  {en ? lvl.descEn : lvl.descEs}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: 4 PASOS SIMPLES */}
      <section id="solucion" className="border-b border-neutral-900 bg-[#080808] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <span className="font-mono text-neutral-500">&rsaquo;</span>
            <h2>{en ? "How It Works in 4 Simple Steps" : "Cómo Funciona en 4 Pasos Simples"}</h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st) => (
              <div key={st.num} className="rounded-lg border border-neutral-800/90 bg-[#111111] p-5">
                <div className="font-mono text-xs font-bold text-neutral-400">{st.num}</div>
                <h3 className="mt-2 text-sm font-semibold text-white">{en ? st.titleEn : st.titleEs}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-400">{en ? st.descEn : st.descEs}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050505] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-6 text-xs text-neutral-500 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/icon.jpg"
              alt="Horizon Space"
              className="h-8 w-8 rounded border border-neutral-800 object-cover"
            />
            <div>
              <div className="font-semibold tracking-[0.18em] text-white">HORIZON SPACE</div>
              <div className="text-[11px] text-neutral-500">
                {en ? "Lunar South Pole Landing Simulator" : "Simulador de Aterrizaje en el Polo Sur Lunar"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 215 190"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-auto shrink-0"
              aria-label="NASA Space Apps Challenge"
            >
              <path d="M 38.2 77 A 72 72 0 0 1 171.8 77" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M 170.8 133.3 A 72 72 0 0 1 39.2 133.3" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="150" y1="42" x2="165" y2="15" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />
              <line x1="158" y1="43" x2="171" y2="26" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
              <line x1="164" y1="48" x2="181" y2="34" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
              <line x1="166" y1="56" x2="193" y2="42" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />
              <circle cx="155.9" cy="53.1" r="11.5" fill="#050505" stroke="#FFFFFF" strokeWidth="4.2" />
              <text x="105" y="74" textAnchor="middle" fill="#E03C31" fontSize="14.5" fontWeight="800" letterSpacing="5" fontFamily="system-ui, -apple-system, sans-serif">
                NASA
              </text>
              <g transform="translate(105, 110) scale(0.78, 1.18)">
                <text x="0" y="0" textAnchor="middle" fill="#FFFFFF" fontSize="35" fontWeight="800" letterSpacing="0.8" fontFamily="system-ui, -apple-system, sans-serif">
                  SPACE APPS
                </text>
              </g>
              <text x="105" y="129" textAnchor="middle" fill="#FFFFFF" fontSize="12.5" fontWeight="700" letterSpacing="4.6" fontFamily="system-ui, -apple-system, sans-serif">
                CHALLENGE
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setEnteredApp(true)}
              className="rounded-full border border-neutral-700 bg-neutral-900 px-5 py-2 font-medium text-white transition hover:border-white hover:bg-white hover:text-black"
            >
              {en ? "Start Simulation →" : "Iniciar Simulación →"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
