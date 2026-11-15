export interface LunarLandmark {
  id: string;
  name: string;
  nameEn: string;
  subtitle: string;
  subtitleEn: string;
  /** East offset from zone centre (km). */
  xKm: number;
  /** North offset from zone centre (km). */
  yKm: number;
  desc: string;
  descEn: string;
  fact: string;
  factEn: string;
}

export const LUNAR_LANDMARKS: LunarLandmark[] = [
  {
    id: "shackleton-rim",
    name: "Borde de Shackleton",
    nameEn: "Shackleton Rim",
    subtitle: "89.87°S, 296.36°E · Cresta Candidata",
    subtitleEn: "89.87°S, 296.36°E · Candidate Ridge",
    xKm: 1.8,
    yKm: 1.6,
    desc: "Cresta elevada junto al borde del cráter Shackleton. Por su altura relativa, recibe luz solar frecuente mientras conserva línea de visión directa hacia la Tierra.",
    descEn: "Elevated ridge along the rim of Shackleton Crater. Due to its relative elevation, it receives frequent sunlight while maintaining direct line-of-sight to Earth.",
    fact: "Objetivo clave de la era Artemis para energía solar continua.",
    factEn: "Key Artemis-era target for near-continuous solar power.",
  },
  {
    id: "south-pole",
    name: "Polo Sur Geográfico",
    nameEn: "Geographic South Pole",
    subtitle: "90.00°S · Eje de Rotación Lunar",
    subtitleEn: "90.00°S · Lunar Rotational Axis",
    xKm: 0,
    yKm: -3.94,
    desc: "Punto exacto del polo sur de rotación de la Luna, situado sobre el borde del cráter Shackleton. Aquí el Sol gira rasante sin superar nunca ±1.9° de elevación.",
    descEn: "Exact southern rotational pole of the Moon, located on the rim of Shackleton Crater. Here the Sun skims the horizon, never exceeding ±1.9° elevation.",
    fact: "Las sombras se proyectan decenas de kilómetros en todas direcciones.",
    factEn: "Shadows stretch tens of kilometers in every direction.",
  },
  {
    id: "shackleton-psr",
    name: "Cráter Shackleton (PSR)",
    nameEn: "Shackleton Crater (PSR)",
    subtitle: "Diámetro 21 km · Profundidad > 4 km",
    subtitleEn: "Diameter 21 km · Depth > 4 km",
    xKm: -1.5,
    yKm: -9.5,
    desc: "Gran cráter de impacto cuyo fondo permanece en oscuridad eterna (Región Permanentemente Sombreada). Nunca recibe luz solar directa debido a la baja inclinación del eje lunar.",
    descEn: "Large impact crater whose floor remains in eternal darkness (Permanently Shadowed Region). It never receives direct sunlight due to the Moon's low axial tilt.",
    fact: "Temperaturas cercanas a -230 °C capaces de atrapar hielo de agua.",
    factEn: "Temperatures near -230 °C capable of trapping water ice.",
  },
  {
    id: "west-ridge",
    name: "Cresta de Elevación Oeste",
    nameEn: "Western Elevation Ridge",
    subtitle: "Altitud relativa hasta +1.9 km",
    subtitleEn: "Relative elevation up to +1.9 km",
    xKm: -11.5,
    yKm: 0.5,
    desc: "Sector elevado del macizo occidental. Sus picos sobresalen por encima de las crestas vecinas, reduciendo el tiempo de ocultamiento solar durante retrasos de lanzamiento.",
    descEn: "Elevated sector of the western massif. Its peaks rise above surrounding ridges, reducing solar occultation duration during launch delays.",
    fact: "Actúa como refugio térmico frente a las sombras largas del cráter.",
    factEn: "Acts as a thermal refuge from long crater shadows.",
  },
];
