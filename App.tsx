import React, { useState, useEffect } from 'react';
import { AppStep, UserInputs, AnalysisResult } from './types';
import { getCoordinates, getSolarData } from './services/solarService';
import { RadiationChart, RotationChart } from './components/SolarCharts';
import { AIConsultant } from './components/AIConsultant';
import { LocationMap } from './components/LocationMap';
import { LiveVoice } from './components/LiveVoice';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LOCATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [inputs, setInputs] = useState<UserInputs>({
    cityName: '',
    startDate: '', // Default to be set in useEffect
    endDate: '',
    implDate: '',
    requiredEnergy: 10,
    useRotation: false,
    coordinates: null,
  });

  // Map Default Center (USA Center roughly or San Francisco)
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lon: -122.4194 });

  // Results State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Set default dates (last month)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    
    setInputs(prev => ({
      ...prev,
      startDate: fmt(lastMonth),
      endDate: fmt(today),
      implDate: fmt(today)
    }));
  }, []);

  const handleCitySearch = async () => {
    if (!inputs.cityName) return;
    setLoading(true);
    const coords = await getCoordinates(inputs.cityName);
    setLoading(false);
    if (coords) {
      setMapCenter({ lat: coords.lat, lon: coords.lon });
      // Also auto-select this point initially
      setInputs(prev => ({ ...prev, coordinates: { lat: coords.lat, lon: coords.lon } }));
    } else {
      setError("City not found. Try entering a valid City, State.");
    }
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    setInputs(prev => ({ ...prev, coordinates: { lat, lon } }));
  };

  const handleNextStep1 = () => {
    if (!inputs.coordinates) {
      setError("Please select a location on the map.");
      return;
    }
    setStep(AppStep.DETAILS);
    setError(null);
  };

  const handleRunAnalysis = async () => {
    if (!inputs.coordinates || !inputs.startDate || !inputs.endDate) return;
    
    setLoading(true);
    setError(null);

    // Fetch Solar Data
    const solarData = await getSolarData(
      inputs.coordinates.lat, 
      inputs.coordinates.lon, 
      inputs.startDate, 
      inputs.endDate
    );

    if (solarData.length === 0) {
      setError("Failed to fetch solar data for this date range.");
      setLoading(false);
      return;
    }

    // Calculations
    const values = solarData.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Simple Physics Model
    const panelEfficiency = 0.20; // 20%
    const panelArea = 1.6; // m2
    const rotationFactor = inputs.useRotation ? 1.25 : 1.0;
    
    const energyPerPanel = avg * panelEfficiency * panelArea * rotationFactor;
    const numPanels = Math.ceil(inputs.requiredEnergy / energyPerPanel);
    const totalPotential = numPanels * energyPerPanel;

    // Optimal Tilt (Simplified: Latitude approximation)
    const tilt = Math.abs(inputs.coordinates.lat);

    setAnalysis({
      location: {
        name: inputs.cityName || "Selected Location",
        lat: inputs.coordinates.lat,
        lon: inputs.coordinates.lon
      },
      averageRadiation: avg,
      maxRadiation: max,
      minRadiation: min,
      totalEnergyPotential: totalPotential,
      panelsRequired: numPanels,
      dailyData: solarData,
      optimalTilt: tilt
    });

    setLoading(false);
    setStep(AppStep.RESULTS);
  };

  const resetApp = () => {
    setStep(AppStep.LOCATION);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <LiveVoice />
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 mb-2 drop-shadow-sm">
          <i className="fas fa-solar-panel mr-3 text-teal-500"></i>
          Helios AI
        </h1>
        <p className="text-slate-500 text-lg">Intelligent Solar Analytics & Feasibility</p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between mb-8 relative max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
        <div className={`absolute top-1/2 left-0 h-1 bg-teal-500 -z-10 rounded-full transition-all duration-500`} style={{ width: `${(step / 2) * 100}%` }}></div>
        
        {[AppStep.LOCATION, AppStep.DETAILS, AppStep.RESULTS].map((s) => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-slate-200 text-slate-400'}`}>
            {s + 1}
          </div>
        ))}
      </div>

      {/* Content Container */}
      <div className="glass rounded-3xl p-8 shadow-2xl transition-all duration-500">
        
        {/* STEP 1: Location */}
        {step === AppStep.LOCATION && (
          <div className="max-w-xl mx-auto animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Pinpoint Your Installation</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-1">Search City</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputs.cityName}
                  onChange={(e) => setInputs({...inputs, cityName: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                  placeholder="e.g. San Francisco, CA"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition"
                />
                <button 
                  onClick={handleCitySearch}
                  className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <LocationMap 
                lat={mapCenter.lat} 
                lon={mapCenter.lon} 
                onLocationSelect={handleLocationSelect} 
                cityName={inputs.cityName}
              />
            </div>

            {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm mb-4 flex items-center"><i className="fas fa-exclamation-circle mr-2"></i>{error}</div>}

            <button 
              onClick={handleNextStep1}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              Next Step <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === AppStep.DETAILS && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Project Specifics</h2>
            <p className="text-center text-slate-500 mb-8">Refine energy requirements and dates.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Selected Coordinates</h4>
                    <p className="text-sm text-slate-600 font-mono">
                      Lat: {inputs.coordinates?.lat.toFixed(5)}<br/>
                      Lon: {inputs.coordinates?.lon.toFixed(5)}
                    </p>
                    <button 
                      onClick={() => setStep(AppStep.LOCATION)} 
                      className="text-xs text-blue-500 hover:text-blue-600 mt-2 font-medium"
                    >
                      <i className="fas fa-map-marker-alt mr-1"></i> Change Location
                    </button>
                 </div>

                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Target Daily Energy (kWh)</label>
                  <div className="relative">
                    <i className="fas fa-bolt absolute left-3 top-3 text-yellow-500"></i>
                    <input 
                      type="number"
                      value={inputs.requiredEnergy}
                      onChange={(e) => setInputs({...inputs, requiredEnergy: parseFloat(e.target.value)})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Analysis Start</label>
                    <input 
                      type="text"
                      value={inputs.startDate}
                      onChange={(e) => setInputs({...inputs, startDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-teal-400 outline-none font-mono" 
                      placeholder="YYYYMMDD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Analysis End</label>
                    <input 
                      type="text"
                      value={inputs.endDate}
                      onChange={(e) => setInputs({...inputs, endDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-teal-400 outline-none font-mono" 
                      placeholder="YYYYMMDD"
                    />
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <input 
                    type="checkbox" 
                    id="rotation"
                    checked={inputs.useRotation}
                    onChange={(e) => setInputs({...inputs, useRotation: e.target.checked})}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300" 
                  />
                  <label htmlFor="rotation" className="ml-3 text-slate-700 font-medium cursor-pointer">
                    Use Rotatable Panels? <span className="text-xs text-green-600 block font-normal">+25% efficiency</span>
                  </label>
                </div>
              </div>
            </div>

            {error && <div className="mt-6 p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">{error}</div>}

            <div className="flex justify-between mt-10">
              <button 
                onClick={() => setStep(AppStep.LOCATION)}
                className="px-6 py-2 rounded-xl border-2 border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button 
                onClick={handleRunAnalysis}
                disabled={loading}
                className="px-8 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-500/25 hover:scale-105 transition disabled:opacity-70"
              >
                {loading ? <span className="flex items-center"><i className="fas fa-circle-notch fa-spin mr-2"></i> Analyzing...</span> : 'Run Analysis'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === AppStep.RESULTS && analysis && (
          <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Analysis Results</h2>
                <p className="text-slate-500">Location: {analysis.location.name}</p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                <button onClick={resetApp} className="px-4 py-2 text-slate-500 hover:text-slate-800 transition"><i className="fas fa-redo mr-2"></i>New Analysis</button>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-yellow-400">
                <p className="text-xs font-bold text-slate-400 uppercase">Avg Radiation</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{analysis.averageRadiation.toFixed(2)} <span className="text-sm font-normal text-slate-500">kWh/m²</span></h3>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-400">
                <p className="text-xs font-bold text-slate-400 uppercase">Panels Needed</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{analysis.panelsRequired} <span className="text-sm font-normal text-slate-500">units</span></h3>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-green-400">
                <p className="text-xs font-bold text-slate-400 uppercase">Daily Output</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{analysis.totalEnergyPotential.toFixed(1)} <span className="text-sm font-normal text-slate-500">kWh</span></h3>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-purple-400">
                <p className="text-xs font-bold text-slate-400 uppercase">Optimal Tilt</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{analysis.optimalTilt.toFixed(1)}° <span className="text-sm font-normal text-slate-500">South</span></h3>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <RadiationChart data={analysis.dailyData} average={analysis.averageRadiation} />
              </div>
              <div className="lg:col-span-1">
                {inputs.useRotation ? (
                   <RotationChart lat={analysis.location.lat} />
                ) : (
                  <div className="h-full bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 text-2xl">
                      <i className="fas fa-sync-alt"></i>
                    </div>
                    <h3 className="font-bold text-slate-700">Fixed Panel Mode</h3>
                    <p className="text-slate-500 text-sm mt-2">Enable "Rotatable Panels" in step 2 to see dynamic angle optimization analysis.</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Consultant Section */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">Helios AI Consultant</span>
              </h2>
              <p className="text-slate-500 mb-4">Powered by Gemini. Ask questions about your results or get a feasibility report.</p>
              
              <AIConsultant result={analysis} userNeeds={inputs.requiredEnergy} />
            </div>

          </div>
        )}

      </div>
      
      <footer className="text-center mt-10 text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Helios AI. Powered by NASA Power API & Google Gemini.
      </footer>
    </div>
  );
};

export default App;