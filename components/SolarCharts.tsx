import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { SolarDataPoint } from '../types';

interface SolarChartsProps {
  data: SolarDataPoint[];
  average: number;
}

export const RadiationChart: React.FC<SolarChartsProps> = ({ data, average }) => {
  return (
    <div className="w-full h-[350px] bg-white rounded-xl shadow-sm p-4 border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Daily Solar Radiation History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            tickFormatter={(value) => value.substring(5)} // Show MM-DD
          />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'kWh/m²', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
          />
          <ReferenceLine y={average} label="Avg" stroke="#f59e0b" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="value" stroke="#0d9488" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RotationChart: React.FC<{ lat: number }> = ({ lat }) => {
  // Simulate optimal rotation angles throughout a day (simplified physics for visualization)
  const hours = Array.from({ length: 13 }, (_, i) => i + 6); // 6am to 6pm
  const data = hours.map(hour => {
    const hourAngle = (hour - 12) * 15; // 0 at noon
    // Simplified model
    const optimalAngle = Math.atan2(Math.sin(hourAngle * Math.PI/180), Math.cos(hourAngle * Math.PI/180) * Math.sin(lat * Math.PI/180)) * 180 / Math.PI;
    return { hour: `${hour}:00`, angle: optimalAngle };
  });

  return (
    <div className="w-full h-[350px] bg-white rounded-xl shadow-sm p-4 border border-slate-100 mt-6">
       <h3 className="text-lg font-semibold text-slate-700 mb-4">Optimal Panel Rotation (Hourly)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Degrees', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Line type="monotone" dataKey="angle" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};