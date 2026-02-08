import React, { useEffect, useState, useCallback } from 'react';
import { UserLocation } from '../types';
import { getAuroraAdvice } from '../services/geminiService';
import { getNtColor } from '../utils/auroraUtils';

interface GeminiAdviceProps {
  location: UserLocation;
  cityName: string;
  kpIndex: number;
  currentNt: number;
  flareCount: number;
  cloudCover: number;
}

const GeminiAdvice: React.FC<GeminiAdviceProps> = ({ location, cityName, kpIndex, currentNt, flareCount, cloudCover }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const fetchAdvice = useCallback(async () => {
    if (!location.available) return;
    
    setLoading(true);
    setError(false);
    try {
      const result = await getAuroraAdvice(location, cityName, kpIndex, currentNt, flareCount, cloudCover);
      setAdvice(result);
    } catch (err) {
      console.error(err);
      setError(true);
      setAdvice("Our expert astronomers are currently offline. Please check the charts.");
    } finally {
      setLoading(false);
    }
  }, [location, cityName, kpIndex, currentNt, flareCount, cloudCover]);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  // Get dynamic color based on magnetic activity for the alert header
  const alertColor = getNtColor(currentNt);

  if (!location.available) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-gray-600">
        <h3 className="text-xl font-display font-bold mb-2 flex items-center gap-2">
          <span className="text-2xl">🤖</span> Gemini Analysis
        </h3>
        <p className="text-gray-400">Waiting for location access to provide expert analysis...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/10 relative overflow-hidden group flex flex-col transition-colors duration-500"
         style={{ borderColor: `${alertColor}50` }}>
       {/* Shimmer effect */}
       <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:animate-[shimmer_2s_infinite] pointer-events-none z-10"></div>

      {/* Header Bar - Translucent & Dynamic Color */}
      <div 
        className="p-4 flex items-center gap-3 shrink-0 relative z-20 backdrop-blur-sm transition-all duration-1000"
        style={{
          background: `linear-gradient(90deg, ${alertColor}aa 0%, ${alertColor}22 100%)`
        }}
      >
        <span className="text-xl text-white drop-shadow-md">✨</span>
        <h3 className="text-lg font-display font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          Gemini's Expert Forecast
        </h3>
      </div>
      
      <div className="p-6 relative z-0">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none flex flex-col gap-4">
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              {advice}
            </p>
            {error && (
              <button 
                onClick={fetchAdvice}
                className="self-start text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
              >
                Retry Connection
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiAdvice;