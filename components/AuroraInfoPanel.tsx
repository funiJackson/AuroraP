import React from 'react';

const AuroraInfoPanel: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row gap-8 items-start">
      <div className="flex-1">
        <h3 className="text-white font-display font-bold text-lg mb-3">Understanding Magnetic Activity</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          The local magnetic activity (measured in nanoTesla, nT) indicates the real-time disturbance in Earth's magnetic field overhead. 
          Unlike the global Kp-index which is a 3-hour average, these nT spikes represent immediate substorms. 
          Higher values correlate with brighter, faster-moving auroras visible at lower latitudes.
        </p>
      </div>
      
      {/* Divider */}
      <div className="w-px bg-white/10 self-stretch hidden md:block"></div>
      
      <div className="flex-1 w-full">
        <h3 className="text-white font-display font-bold text-lg mb-3">Activity Thresholds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.6)] shrink-0"></div>
                <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">0-50 nT</span>
                    <span className="text-xs text-gray-500">Quiet (Camera Only)</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.6)] shrink-0"></div>
                <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">50-100 nT</span>
                    <span className="text-xs text-gray-500">Unsettled (Low Horizon)</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#fb923c] shadow-[0_0_8px_rgba(251,146,60,0.6)] shrink-0"></div>
                <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">100-200 nT</span>
                    <span className="text-xs text-gray-500">Active (Visible to Eye)</span>
                </div>
            </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)] shrink-0"></div>
                <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">200+ nT</span>
                    <span className="text-xs text-gray-500">Storm (Bright Overhead)</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuroraInfoPanel;