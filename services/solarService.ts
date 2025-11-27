import { LocationData, SolarDataPoint } from '../types';

const NASA_API_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const GEO_API_URL = 'https://nominatim.openstreetmap.org/search';

export const getCoordinates = async (cityName: string): Promise<LocationData | null> => {
  try {
    const response = await fetch(`${GEO_API_URL}?q=${encodeURIComponent(cityName)}&format=json&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        name: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
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
    // NASA Power API for Solar Radiation (ALLSKY_SFC_SW_DWN)
    const url = `${NASA_API_URL}?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
    
    const response = await fetch(url);
    const data = await response.json();
    const parameterData = data.properties.parameter.ALLSKY_SFC_SW_DWN;
    
    const results: SolarDataPoint[] = Object.keys(parameterData).map((dateKey) => {
      // Format YYYYMMDD to YYYY-MM-DD for charts
      const formattedDate = `${dateKey.substring(0, 4)}-${dateKey.substring(4, 6)}-${dateKey.substring(6, 8)}`;
      return {
        date: formattedDate,
        value: parameterData[dateKey] === -999 ? 0 : parameterData[dateKey], // Handle missing data
      };
    });

    return results;
  } catch (error) {
    console.error("Solar Data fetch error", error);
    return [];
  }
};