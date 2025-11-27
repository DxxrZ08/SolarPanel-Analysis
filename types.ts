export interface SolarDataPoint {
  date: string;
  value: number;
}

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

export interface AnalysisResult {
  location: LocationData;
  averageRadiation: number;
  maxRadiation: number;
  minRadiation: number;
  totalEnergyPotential: number; // kWh/day
  panelsRequired: number;
  dailyData: SolarDataPoint[];
  optimalTilt: number;
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