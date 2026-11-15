export interface Site {
  id: string;
  name: string;
  /** Only sites with real ephemeris are selectable. */
  ready: boolean;
  lat?: number;
  lon?: number;
  orbitalUrl?: string;
  terrainUrl?: string;
}

/**
 * Coordinates for Shackleton are taken from the JPL Horizons query that
 * produced /data/orbital_data.json. Other sites need their own Horizons
 * tables + DEM tile before they can be enabled.
 */
export const SITES: Site[] = [
  { id: "shackleton", name: "Shackleton Rim", ready: true, lat: -89.87, lon: 296.36, orbitalUrl: "/data/orbital_data.json", terrainUrl: "/data/terrain.json" },
  { id: "malapert", name: "Malapert", ready: false },
  { id: "nobile", name: "Nobile", ready: false },
  { id: "amundsen", name: "Amundsen", ready: false },
];
