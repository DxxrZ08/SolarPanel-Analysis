export interface SolarDataPoint {
  date: string;
  radiation: number; // ALLSKY_SFC_SW_DWN (kWh/m^2/day)
  temperature: number; // T2M (Celsius)
  cloudCover: number; // CLOUD_AMT (%)
}

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

export interface CurrentWeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  cloudCover: number;
  conditionCode: number; // WMO Weather code
  isDay: number;
}

export interface AnalysisResult {
  location: LocationData;
  averageRadiation: number;
  maxRadiation: number;
  minRadiation: number;
  averageTemperature: number;
  averageCloudCover: number;
  totalEnergyPotential: number; // kWh/day
  panelsRequired: number;
  dailyData: SolarDataPoint[];
  optimalTilt: number;
  currentWeather?: CurrentWeatherData;
}

export enum AppStep {
  LOCATION = 0,
  DETAILS = 1,
  RESULTS = 2,
}

export interface UserInputs {
  cityName: string;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  implDate: string; // YYYYMMDD
  requiredEnergy: number; // kWh
  useRotation: boolean;
  coordinates: {
    lat: number;
    lon: number;
  } | null;
}