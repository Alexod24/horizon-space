export interface LunarLandmark {
  id: string;
  name: string;
  subtitle: string;
  /** East offset from zone centre (km). */
  xKm: number;
  /** North offset from zone centre (km). */
  yKm: number;
  desc: string;
  fact: string;
}

export const LUNAR_LANDMARKS: LunarLandmark[] = [
  {
    id: "shackleton-rim",
    name: "Borde de Shackleton",
    subtitle: "89.87°S, 296.36°E · Cresta Candidata",
    xKm: 1.8,
    yKm: 1.6,
    desc: "Cresta elevada junto al borde del cráter Shackleton. Por su altura relativa, recibe luz solar frecuente mientras conserva línea de visión directa hacia la Tierra.",
    fact: "Objetivo clave de la era Artemis para energía solar continua.",
  },
  {
    id: "south-pole",
    name: "Polo Sur Geográfico",
    subtitle: "90.00°S · Eje de Rotación Lunar",
    xKm: 0,
    yKm: -3.94,
    desc: "Punto exacto del polo sur de rotación de la Luna, situado sobre el borde del cráter Shackleton. Aquí el Sol gira rasante sin superar nunca ±1.9° de elevación.",
    fact: "Las sombras se proyectan decenas de kilómetros en todas direcciones.",
  },
  {
    id: "shackleton-psr",
    name: "Cráter Shackleton (PSR)",
    subtitle: "Diámetro 21 km · Profundidad > 4 km",
    xKm: -1.5,
    yKm: -9.5,
    desc: "Gran cráter de impacto cuyo fondo permanece en oscuridad eterna (Región Permanentemente Sombreada). Nunca recibe luz solar directa debido a la baja inclinación del eje lunar.",
    fact: "Temperaturas cercanas a -230 °C capaces de atrapar hielo de agua.",
  },
  {
    id: "west-ridge",
    name: "Cresta de Elevación Oeste",
    subtitle: "Altitud relativa hasta +1.9 km",
    xKm: -11.5,
    yKm: 0.5,
    desc: "Sector elevado del macizo occidental. Sus picos sobresalen por encima de las crestas vecinas, reduciendo el tiempo de ocultamiento solar durante retrasos de lanzamiento.",
    fact: "Actúa como refugio térmico frente a las sombras largas del cráter.",
  },
];
