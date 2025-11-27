import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSolarReport, generateDeepSolarReport, chatWithSolarExpert, findInstallers, speakText } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface AIConsultantProps {
  result: AnalysisResult;
  userNeeds: number;
}

export const AIConsultant: React.FC<AIConsultantProps> = ({ result, userNeeds }) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'basic' | 'deep' | 'installers'>('basic');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Generate basic report on mount
    fetchReport('basic');
  }, [result]);

  const fetchReport = async (type: 'basic' | 'deep' | 'installers') => {
    setLoading(true);
    setActiveTab(type);
    let text = '';
    
    if (type === 'basic') {
       text = await generateSolarReport(result, userNeeds);
    } else if (type === 'deep') {
       text = await generateDeepSolarReport(result);
    } else if (type === 'installers') {
       text = await findInstallers(result.location.lat, result.location.lon);
    }
    
    setReport(text || "No report generated.");
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newUserMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatInput('');
    setChatLoading(true);

    const response = await chatWithSolarExpert(chatInput, result, [...chatHistory, newUserMsg]);
    
    setChatHistory(prev => [...prev, { role: 'model', content: response || "Error." }]);
    setChatLoading(false);
  };

  const playReport = async () => {
    if (isPlaying) return; // Simple prevent double click, ideally handle stop
    setIsPlaying(true);
    const audioData = await speakText(report.substring(0, 500)); // Limit length for demo responsiveness
    if (audioData) {
      const audio = new Audio("data:audio/mp3;base64," + audioData);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Report Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl shadow-lg border border-indigo-100 flex flex-col h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-robot"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Helios AI</h3>
          </div>
          <button 
            onClick={playReport}
            disabled={loading || isPlaying}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-teal-100 text-teal-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title="Read Report Aloud"
          >
            <i className={`fas ${isPlaying ? 'fa-volume-up' : 'fa-play'}`}></i>
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex space-x-2 mb-4">
           <button 
             onClick={() => fetchReport('basic')}
             className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'basic' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => fetchReport('deep')}
             className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'deep' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
           >
             <i className="fas fa-brain"></i> Deep Analysis
           </button>
           <button 
             onClick={() => fetchReport('installers')}
             className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'installers' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
           >
             <i className="fas fa-map-marker-alt"></i> Installers
           </button>
        </div>
        
        <div className="flex-1 bg-white rounded-xl border border-indigo-50 p-4 overflow-y-auto custom-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-500 font-medium animate-pulse">
                {activeTab === 'deep' ? 'Thinking deeply (Gemini Pro)...' : 'Analyzing data...'}
              </p>
            </div>
          ) : (
            <div className="prose prose-indigo prose-sm max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[600px]">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-comments text-teal-500"></i> Ask the Expert
        </h3>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm italic space-y-2">
              <p>"How much will this save me per month?"</p>
              <p>"What is the best battery for this system?"</p>
              <p>"Search for current tax incentives"</p>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-teal-500 text-white rounded-br-sm' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm"
            placeholder="Type your question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={chatLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl transition disabled:opacity-50 shadow-md shadow-teal-500/20"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};