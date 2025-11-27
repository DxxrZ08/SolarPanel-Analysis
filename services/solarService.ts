import { LocationData, SolarDataPoint } from '../types';

const NASA_API_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

export const getCoordinates = async (cityName: string): Promise<LocationData | null> => {
  try {
    // Use OpenStreetMap Nominatim API (Free, no key required)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        name: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    } else {
      console.warn("Geocoding failed: No results found");
      return null;
    }
  } catch (error) {
    console.error("Geocoding error", error);
    return null;
  }
};

export const getSolarData = async (
  lat: number,
  lon: number,
  start: string,
  end: string
): Promise<SolarDataPoint[]> => {
  try {
    // NASA Power API Parameters:
    // ALLSKY_SFC_SW_DWN: All Sky Surface Shortwave Downward Irradiance (kWh/m^2/day)
    // T2M: Temperature at 2 Meters (C)
    // CLOUD_AMT: Cloud Amount (%)
    const url = `${NASA_API_URL}?parameters=ALLSKY_SFC_SW_DWN,T2M,CLOUD_AMT&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const radiationData = data.properties.parameter.ALLSKY_SFC_SW_DWN;
    const tempData = data.properties.parameter.T2M;
    const cloudData = data.properties.parameter.CLOUD_AMT;
    
    const results: SolarDataPoint[] = Object.keys(radiationData).map((dateKey) => {
      // Format YYYYMMDD to YYYY-MM-DD for charts
      const formattedDate = `${dateKey.substring(0, 4)}-${dateKey.substring(4, 6)}-${dateKey.substring(6, 8)}`;
      
      return {
        date: formattedDate,
        radiation: radiationData[dateKey] === -999 ? 0 : radiationData[dateKey],
        temperature: tempData[dateKey] === -999 ? 0 : tempData[dateKey],
        cloudCover: cloudData[dateKey] === -999 ? 0 : cloudData[dateKey],
      };
    });

    return results;
  } catch (error) {
    console.error("Solar Data fetch error", error);
    return [];
  }
};