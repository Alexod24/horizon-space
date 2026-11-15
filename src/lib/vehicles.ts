export interface LunarVehicle {
  id: string;
  name: string;
  agency: string;
  status: "Estándar" | "En diseño / Prototipo" | "Congelado en Luna" | "Pausado / Cancelado";
  /** Mast / solar-array height above lunar ground (m). */
  heightM: number;
  /** Maximum hours without sunlight before irreversible freezing. */
  maxDarkHours: number;
  image?: string;
  summary: string;
}

export const DEFAULT_VEHICLE: LunarVehicle = {
  id: "default",
  name: "Módulo Estándar (Default)",
  agency: "Genérico · Sin selección específica",
  status: "Estándar",
  heightM: 2.0,
  maxDarkHours: 48,
  summary: "Parámetros base de referencia (mástil 2.0 m, límite 48 h en sombra).",
};

export const VEHICLES: LunarVehicle[] = [
  {
    id: "viper",
    name: "VIPER Rover",
    agency: "NASA",
    status: "Pausado / Cancelado",
    heightM: 2.0,
    maxDarkHours: 50,
    image: "/vehicles/viper.jpg",
    summary: "Diseñado para cazar hielo en Shackleton; sobrevive ~50 h en sombra.",
  },
  {
    id: "nova-c",
    name: "IM-2 Athena (Nova-C)",
    agency: "Intuitive Machines · CLPS",
    status: "Congelado en Luna",
    heightM: 4.3,
    maxDarkHours: 24,
    image: "/vehicles/nova-c.jpg",
    summary: "Módulo alto (4.3 m) con paneles laterales; ~24 h de batería sin sol.",
  },
  {
    id: "chandrayaan-3",
    name: "Vikram + Pragyan",
    agency: "ISRO",
    status: "Congelado en Luna",
    heightM: 2.0,
    maxDarkHours: 14,
    image: "/vehicles/chandrayaan-3.jpg",
    summary: "Primer aterrizaje cerca del Polo Sur; se congeló al caer la noche lunar (~14 h).",
  },
  {
    id: "artemis-ltv",
    name: "Artemis LTV",
    agency: "NASA Artemis",
    status: "En diseño / Prototipo",
    heightM: 2.6,
    maxDarkHours: 100,
    image: "/vehicles/artemis-ltv.jpg",
    summary: "Prototipo de vehículo lunar de largo alcance; ~100 h de autonomía térmica.",
  },
];

export function findVehicle(id: string): LunarVehicle {
  if (id === DEFAULT_VEHICLE.id) return DEFAULT_VEHICLE;
  return VEHICLES.find((v) => v.id === id) ?? DEFAULT_VEHICLE;
}
