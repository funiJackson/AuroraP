
export interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  endTime: string;
  classType: string;
  sourceLocation: string;
  activeRegionNum: number;
}

export interface GeomagneticStorm {
  gstID: string;
  startTime: string;
  allKpIndex: {
    observedTime: string;
    kpIndex: number;
    source: string;
  }[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  available: boolean;
  error?: string;
}

export interface LocalWeather {
  cloudCover: number;
  weatherCode: number; // WMO code
  temperature: number;
}

export interface AuroraData {
  flares: SolarFlare[];
  storms: GeomagneticStorm[];
  currentKp: number;
  loading: boolean;
  error: string | null;
}

export enum ViewingChance {
  IMPOSSIBLE = "Impossible",
  LOW = "Low",
  MODERATE = "Moderate",
  HIGH = "High",
  EXTREME = "Extreme"
}
