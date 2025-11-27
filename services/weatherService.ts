import { CurrentWeatherData } from '../types';

export const getCurrentWeather = async (lat: number, lon: number): Promise<CurrentWeatherData | null> => {
  try {
    // Open-Meteo API (Free, no key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,is_day&timezone=auto`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.current) return null;

    const current = data.current;

    return {
      temperature: current.temperature_2m,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      cloudCover: current.cloud_cover,
      conditionCode: current.weather_code,
      isDay: current.is_day
    };
  } catch (error) {
    console.error("Current Weather fetch error", error);
    return null;
  }
};

export const getWeatherDescription = (code: number): { label: string; icon: string; color: string } => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  switch (code) {
    case 0: return { label: 'Clear Sky', icon: 'fa-sun', color: 'text-yellow-500' };
    case 1: return { label: 'Mainly Clear', icon: 'fa-sun', color: 'text-yellow-400' };
    case 2: return { label: 'Partly Cloudy', icon: 'fa-cloud-sun', color: 'text-orange-300' };
    case 3: return { label: 'Overcast', icon: 'fa-cloud', color: 'text-gray-500' };
    case 45: 
    case 48: return { label: 'Foggy', icon: 'fa-smog', color: 'text-gray-400' };
    case 51:
    case 53:
    case 55: return { label: 'Drizzle', icon: 'fa-cloud-rain', color: 'text-blue-300' };
    case 61:
    case 63:
    case 65: return { label: 'Rain', icon: 'fa-cloud-showers-heavy', color: 'text-blue-500' };
    case 71:
    case 73:
    case 75: return { label: 'Snow', icon: 'fa-snowflake', color: 'text-cyan-200' };
    case 95:
    case 96:
    case 99: return { label: 'Thunderstorm', icon: 'fa-bolt', color: 'text-purple-500' };
    default: return { label: 'Unknown', icon: 'fa-cloud', color: 'text-gray-400' };
  }
};