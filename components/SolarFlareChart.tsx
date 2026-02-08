import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { SolarFlare } from '../types';

interface SolarFlareChartProps {
  flares: SolarFlare[];
}

const SolarFlareChart: React.FC<SolarFlareChartProps> = ({ flares }) => {
  // Process data for chart
  // Sort oldest to newest for logical timeline (Left to Right)
  const sortedFlares = [...flares].sort((a, b) => new Date(a.peakTime).getTime() - new Date(b.peakTime).getTime());

  const data = sortedFlares.map(flare => {
    // Convert classType (e.g., M1.5) to a numeric value for plotting
    // B=10, C=20, M=30, X=40
    let power = 0;
    const type = flare.classType.charAt(0);
    const value = parseFloat(flare.classType.substring(1)) || 1;
    
    if (type === 'B') power = 10 + value;
    else if (type === 'C') power = 20 + value;
    else if (type === 'M') power = 30 + value;
    else if (type === 'X') power = 40 + value;

    return {
      time: new Date(flare.peakTime).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
      fullTime: new Date(flare.peakTime).toLocaleString(),
      power: power,
      classType: flare.classType,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-700 p-3 rounded shadow-xl backdrop-blur-sm">
          <p className="text-gray-300 text-xs mb-1">{payload[0].payload.fullTime}</p>
          <p className="text-aurora-green font-bold text-lg">Class {payload[0].payload.classType}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 glass-panel p-4 rounded-2xl relative">
       <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Solar Flare Timeline (7 Days)</h3>
        <span className="text-xs text-aurora-blue bg-aurora-blue/10 px-2 py-1 rounded">Real-time Data</span>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm italic">
          No significant flares recorded recently.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280" 
              tick={{fontSize: 10}} 
              tickMargin={10}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis 
              hide 
              domain={[10, 50]} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20' }} />
            <Line 
              type="monotone" 
              dataKey="power" 
              stroke="#00ff9d" 
              strokeWidth={2} 
              dot={{ fill: '#050a14', stroke: '#00ff9d', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SolarFlareChart;