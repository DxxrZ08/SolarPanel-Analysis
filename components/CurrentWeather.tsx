import React from 'react';
import { CurrentWeatherData } from '../types';
import { getWeatherDescription } from '../services/weatherService';

interface CurrentWeatherProps {
  data: CurrentWeatherData;
  locationName: string;
}

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, locationName }) => {
  const { label, icon, color } = getWeatherDescription(data.conditionCode);
  
  // Adjust icon if it's night and the condition is clear/partly cloudy
  let finalIcon = icon;
  let finalColor = color;
  
  if (data.isDay === 0) {
    if (data.conditionCode === 0 || data.conditionCode === 1) {
      finalIcon = 'fa-moon';
      finalColor = 'text-indigo-300';
    } else if (data.conditionCode === 2) {
      finalIcon = 'fa-cloud-moon';
      finalColor = 'text-indigo-200';
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm mb-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-5">
           <div className={`w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center text-4xl ${finalColor}`}>
             <i className={`fas ${finalIcon}`}></i>
           </div>
           <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Current Conditions</h3>
             <p className="text-xl font-bold text-slate-800">{locationName}</p>
             <p className="text-lg text-slate-600 font-medium">{label}</p>
           </div>
        </div>

        <div className="flex gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm min-w-[100px] text-center">
            <i className="fas fa-temperature-high text-red-400 mb-1"></i>
            <div className="text-2xl font-bold text-slate-800">{data.temperature}<span className="text-sm align-top">°C</span></div>
            <div className="text-xs text-slate-400">Temp</div>
          </div>
          
          <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm min-w-[100px] text-center">
            <i className="fas fa-wind text-teal-400 mb-1"></i>
            <div className="text-2xl font-bold text-slate-800">{data.windSpeed}<span className="text-xs align-baseline ml-1">km/h</span></div>
            <div className="text-xs text-slate-400">Wind</div>
          </div>

          <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm min-w-[100px] text-center">
            <i className="fas fa-cloud text-gray-400 mb-1"></i>
            <div className="text-2xl font-bold text-slate-800">{data.cloudCover}<span className="text-sm align-top">%</span></div>
            <div className="text-xs text-slate-400">Clouds</div>
          </div>

          <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm min-w-[100px] text-center">
             <i className="fas fa-tint text-blue-400 mb-1"></i>
             <div className="text-2xl font-bold text-slate-800">{data.precipitation}<span className="text-xs align-baseline ml-1">mm</span></div>
             <div className="text-xs text-slate-400">Precip</div>
          </div>
        </div>

      </div>
      <div className="mt-4 text-xs text-center md:text-right text-slate-400">
        Live data from Open-Meteo
      </div>
    </div>
  );
};