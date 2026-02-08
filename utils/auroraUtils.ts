import { ViewingChance } from '../types';

/**
 * Estimation of viewing probability based on Latitude, Kp Index, and Cloud Cover.
 */
export const calculateViewingChance = (lat: number, kp: number, cloudCover: number = 0): ViewingChance => {
  // If it's completely overcast, you can't see anything regardless of the aurora
  if (cloudCover > 85) return ViewingChance.IMPOSSIBLE;

  const absLat = Math.abs(lat);
  let chance = ViewingChance.IMPOSSIBLE;

  // 1. Determine base magnetic chance
  // High latitudes (Circle)
  if (absLat >= 65) {
    if (kp >= 1) chance = ViewingChance.HIGH;
    else chance = ViewingChance.MODERATE;
  }
  // Mid-High latitudes
  else if (absLat >= 60) {
    if (kp >= 3) chance = ViewingChance.HIGH;
    else if (kp >= 2) chance = ViewingChance.MODERATE;
    else chance = ViewingChance.LOW;
  }
  // Mid latitudes
  else if (absLat >= 55) {
    if (kp >= 5) chance = ViewingChance.EXTREME;
    else if (kp >= 4) chance = ViewingChance.HIGH;
    else if (kp >= 3) chance = ViewingChance.MODERATE;
    else chance = ViewingChance.LOW;
  }
  // Lower Mid latitudes
  else if (absLat >= 50) {
    if (kp >= 7) chance = ViewingChance.EXTREME;
    else if (kp >= 6) chance = ViewingChance.HIGH;
    else if (kp >= 5) chance = ViewingChance.MODERATE;
    else chance = ViewingChance.LOW;
  }
  // Low latitudes
  else if (absLat >= 45) {
    if (kp >= 8) chance = ViewingChance.EXTREME;
    else if (kp >= 7) chance = ViewingChance.HIGH;
    else chance = ViewingChance.LOW;
  }

  // 2. Downgrade based on clouds
  if (chance !== ViewingChance.IMPOSSIBLE) {
    if (cloudCover > 60) {
      // Significant clouds downgrade chance significantly
      if (chance === ViewingChance.EXTREME) chance = ViewingChance.MODERATE;
      else if (chance === ViewingChance.HIGH) chance = ViewingChance.LOW;
      else chance = ViewingChance.LOW; // Moderate becomes Low
    } else if (cloudCover > 30) {
      // Light clouds downgrade slightly
      if (chance === ViewingChance.EXTREME) chance = ViewingChance.HIGH;
      else if (chance === ViewingChance.HIGH) chance = ViewingChance.MODERATE;
    }
  }

  return chance;
};

export const getKpColor = (kp: number): string => {
  if (kp < 3) return 'text-green-400';
  if (kp < 5) return 'text-yellow-400';
  if (kp < 7) return 'text-orange-500';
  return 'text-red-600';
};

// AuroraWatch UK style thresholds
export const getNtColor = (nt: number): string => {
  if (nt < 50) return '#4ade80'; // Green (No significant activity)
  if (nt < 100) return '#facc15'; // Yellow (Minor activity)
  if (nt < 200) return '#fb923c'; // Amber (Active)
  return '#ef4444'; // Red (Major activity)
};

export const getNtDescription = (nt: number): string => {
  if (nt < 50) return 'No Significant Activity';
  if (nt < 100) return 'Minor Activity (Cameras might see it)';
  if (nt < 200) return 'Amber Alert: Likely Visible by Eye';
  return 'Red Alert: Aurora Storm!';
};

export const kpToBaseNt = (kp: number): number => {
  // Adjusted baseline values to align with AuroraWatch UK style readings
  // where ~40-50nT is often the upper end of "Quiet".
  const floorKp = Math.floor(kp);
  
  // Interpolation for finer granularity if needed, but using steps for stability
  switch(floorKp) {
    case 0: return 12;
    case 1: return 32;
    case 2: return 48; // Right below the 50nT threshold for Yellow
    case 3: return 75; // Yellow
    case 4: return 115; // Amber
    case 5: return 180; // Amber/Red border
    case 6: return 260; // Red
    case 7: return 400;
    case 8: return 600;
    case 9: return 900;
    default: return 25;
  }
};