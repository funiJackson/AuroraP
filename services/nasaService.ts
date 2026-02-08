import { SolarFlare, GeomagneticStorm } from '../types';

const NASA_BASE_URL = 'https://api.nasa.gov/DONKI';

// Ideally, API keys should be stored in environment variables (e.g., process.env.NASA_API_KEY).
// We prioritize the environment variable if available, otherwise use the provided key.
// Note: In a production client-side app, keys are visible in the network tab.
const API_KEY = process.env.NASA_API_KEY || 'mGQftrtdXNXx3TEVUV0AVeZPrlwaGAYhL8QqPUK0';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const fetchSolarFlares = async (startDate: Date, endDate: Date): Promise<SolarFlare[]> => {
  try {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const response = await fetch(`${NASA_BASE_URL}/FLR?startDate=${start}&endDate=${end}&api_key=${API_KEY}`);
    
    if (!response.ok) {
      // 404 indicates no data found for the period, which is valid (no flares)
      if (response.status === 404) return [];
      throw new Error(`NASA API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch solar flares:", error);
    return [];
  }
};

export const fetchGeomagneticStorms = async (startDate: Date, endDate: Date): Promise<GeomagneticStorm[]> => {
  try {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const response = await fetch(`${NASA_BASE_URL}/GST?startDate=${start}&endDate=${end}&api_key=${API_KEY}`);
    
    if (!response.ok) {
      // 404 often means no data found for date range in DONKI
      if (response.status === 404) return [];
      throw new Error(`NASA API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch geomagnetic storms:", error);
    return [];
  }
};