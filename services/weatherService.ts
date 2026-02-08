
import { LocalWeather } from '../types';

export const fetchWeather = async (lat: number, lon: number): Promise<LocalWeather> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,cloud_cover`
    );
    
    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    return {
      cloudCover: data.current?.cloud_cover ?? 0,
      weatherCode: data.current?.weather_code ?? 0,
      temperature: data.current?.temperature_2m ?? 0
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return { cloudCover: 0, weatherCode: 0, temperature: 0 };
  }
};

export const fetchCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    // Using BigDataCloud's free client-side reverse geocoding API
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    
    if (!response.ok) return "Unknown Location";

    const data = await response.json();
    return data.city || data.locality || data.principalSubdivision || "Unknown Location";
  } catch (error) {
    console.error("Failed to fetch city name:", error);
    return "Unknown Location";
  }
};
