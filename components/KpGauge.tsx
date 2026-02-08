import React from 'react';
import { getKpColor } from '../utils/auroraUtils';

interface KpGaugeProps {
  kp: number;
}

const KpGauge: React.FC<KpGaugeProps> = ({ kp }) => {
  const rotation = (kp / 9) * 180; // 0 to 180 degrees
  
  return (
    <div className="relative flex flex-col items-center justify-center p-6 glass-panel rounded-2xl">
      <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-4">Planetary K-Index</h3>
      
      <div className="relative w-48 h-24 overflow-hidden mb-2">
        {/* Gauge Arc Background */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-white/10 box-border"></div>
        
        {/* Needle */}
        <div 
          className="absolute top-full left-1/2 w-1 h-24 bg-white origin-top -translate-x-1/2 transition-transform duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
        >
          <div className="w-4 h-4 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-2">
        <span className={`text-5xl font-display font-bold ${getKpColor(kp)} drop-shadow-lg`}>
          {kp.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 mt-1">Scale 0-9</span>
      </div>

      <div className="w-full flex justify-between px-2 mt-4 text-[10px] text-gray-500 font-mono">
        <span>CALM</span>
        <span>STORM</span>
      </div>
    </div>
  );
};

export default KpGauge;