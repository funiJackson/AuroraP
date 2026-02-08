import { GoogleGenAI } from "@google/genai";
import { UserLocation } from "../types";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAuroraAdvice = async (
  location: UserLocation,
  cityName: string,
  kpIndex: number,
  currentNt: number,
  recentFlares: number,
  cloudCover: number
): Promise<string> => {
  try {
    const lat = location.latitude.toFixed(2);
    const long = location.longitude.toFixed(2);
    const locationName = cityName || `${lat}, ${long}`;
    
    const prompt = `
      You are a friendly aurora guide helping a beginner understand if they can see the Northern Lights.
      
      User Location: ${locationName} (Lat: ${lat}).
      Current Magnetic Activity: ${Math.round(currentNt)} nT (nanoTesla).
      Global Storm Level (Kp): ${kpIndex}.
      Solar Flares (Last 7 days): ${recentFlares}.
      Sky Condition: ${cloudCover}% Cloud Cover.
      
      Task:
      1. Can they see the aurora right now in ${locationName}? Start with "Yes", "No", or "Maybe". Consider BOTH magnetic activity AND cloud cover (If clouds > 70%, it's almost impossible even if activity is high).
      2. Explain why in simple language.
      3. Give a fun tip specific to aurora watching.
      
      Keep it short (under 80 words) and encouraging.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ text: prompt }]
      },
    });

    const text = response.text || "Unable to retrieve expert advice at this moment.";
    // Clean up markdown bold markers (**) as requested in the design
    return text.replace(/\*\*/g, "");
  } catch (error: any) {
    // Gracefully handle quota exhaustion (429)
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        console.warn("Gemini Quota Exceeded");
        return "Our AI astronomer is currently busy with many requests. Please use the charts and Kp index above for your forecast.";
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
};