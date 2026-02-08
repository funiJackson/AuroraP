import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { getNtColor, getNtDescription } from '../utils/auroraUtils';

export interface ActivityPoint {
  time: string;
  nt: number;
}

interface LiveActivityChartProps {
  data: ActivityPoint[];
  currentNt: number;
}

const LiveActivityChart: React.FC<LiveActivityChartProps> = ({ data, currentNt }) => {
  // Calculate max value for domain and ticks (increments of 50)
  const dataMax = Math.max(...data.map(d => d.nt), 0);
  // Ensure chart goes at least to 250, or rounds up to nearest 50 above dataMax
  const chartMax = Math.max(Math.ceil(dataMax / 50) * 50, 250);
  
  // Generate ticks: [0, 50, 100, ..., chartMax]
  const ticks = Array.from({ length: (chartMax / 50) + 1 }, (_, i) => i * 50);

  const statusText = getNtDescription(currentNt);
  const statusColor = getNtColor(currentNt);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded shadow-xl backdrop-blur-md z-50">
          <p className="text-gray-400 text-xs mb-1">Time: {payload[0].payload.time}</p>
          <p className="font-bold text-lg" style={{ color: getNtColor(val) }}>
            {Math.round(val)} nT
          </p>
          <p className="text-xs text-white/70 mt-1">{getNtDescription(val)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 relative z-10">
        <div>
          <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">
            Magnetic Activity (Last 24 Hours)
          </h3>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-3">
               <span className="text-4xl md:text-5xl font-display font-bold text-white drop-shadow-lg">
                {Math.round(currentNt)}
              </span>
              <span className="text-lg text-gray-400 font-light">nT</span>
            </div>
            <span className="text-sm font-medium mt-1 px-2 py-0.5 rounded w-fit" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
              {statusText}
            </span>
          </div>
        </div>
        
        <div className="text-left md:text-right">
          <div className="flex items-center gap-2 md:justify-end mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aurora-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-aurora-green"></span>
            </span>
            <span className="text-aurora-green text-[10px] font-bold tracking-widest uppercase">HOURLY UPDATES</span>
          </div>
          <p className="text-[10px] text-gray-500 max-w-[200px]">
            Activity thresholds (Green/Yellow/Amber/Red) indicate aurora visibility likelihood.
          </p>
        </div>
      </div>
      
      {/* Chart - Fixed Height Container */}
      <div className="w-full h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280" 
              tick={{fontSize: 10}} 
              interval={3} 
            />
            <YAxis 
              stroke="#6b7280" 
              tick={{fontSize: 11, fontWeight: 500}}
              domain={[0, chartMax]}
              ticks={ticks}
              width={35}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
            
            {/* AuroraWatch UK Style Zones (Background bands) */}
            <ReferenceArea y1={0} y2={50} fill="#4ade80" fillOpacity={0.05} />
            <ReferenceArea y1={50} y2={100} fill="#facc15" fillOpacity={0.05} />
            <ReferenceArea y1={100} y2={200} fill="#fb923c" fillOpacity={0.05} />
            <ReferenceArea y1={200} y2={chartMax} fill="#ef4444" fillOpacity={0.05} />

            {/* Threshold Lines */}
            <ReferenceLine y={50} stroke="#4ade80" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={100} stroke="#facc15" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={200} stroke="#fb923c" strokeDasharray="3 3" strokeOpacity={0.4} />
            
            <Bar dataKey="nt" animationDuration={1000} radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getNtColor(entry.nt)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 justify-center text-[10px] text-gray-400 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1 bg-[#4ade80] rounded-full opacity-50"></div> No Activity
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1 bg-[#facc15] rounded-full opacity-50"></div> Minor
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1 bg-[#fb923c] rounded-full opacity-50"></div> Amber Alert
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1 bg-[#ef4444] rounded-full opacity-50"></div> Red Alert
        </div>
      </div>
    </div>
  );
};

export default LiveActivityChart;