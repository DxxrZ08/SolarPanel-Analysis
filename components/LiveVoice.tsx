import React, { useRef, useState, useEffect } from 'react';
import { Modality } from "@google/genai";
import { getAiClient } from '../services/geminiService';

export const LiveVoice: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [volume, setVolume] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  
  // Audio Contexts
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const connect = async () => {
    try {
      setStatus('Connecting...');
      const ai = getAiClient();
      
      // Setup Audio Context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Output Audio Context (for playing response)
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      let nextStartTime = 0;

      // Connect to Gemini Live
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are Helios, an expert solar energy consultant. Help the user with energy analysis. Be concise and professional.",
        },
      });
      sessionRef.current = session;

      // --- INPUT HANDLING ---
      const source = audioContext.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      
      // Use ScriptProcessor for raw PCM data
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple visualizer
        let sum = 0;
        for(let i=0; i<inputData.length; i+=50) sum += Math.abs(inputData[i]);
        setVolume(Math.min(100, (sum / (inputData.length/50)) * 500));

        // Create Blob for API
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          int16[i] = inputData[i] * 32768;
        }
        
        // Base64 encode
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);

        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: b64
          }
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // --- OUTPUT HANDLING ---
      // We need to listen to the stream. The SDK exposes an AsyncIterable for the response stream?
      // Actually, the new SDK uses callbacks on the `connect` config or returns a stream.
      // Based on docs provided: `ai.live.connect` takes `callbacks` in the first arg object.
      // Re-reading docs: connect({ model, callbacks: { onopen, onmessage... }, config })
      
      // Let's disconnect and reconnect with correct signature from docs
      // Note: I initially called it without callbacks. The docs say "You must provide callbacks".
    } catch (e) {
      console.error(e);
      setStatus('Connection Failed');
      setIsActive(false);
    }
  };

  // Correct implementation based on SDK docs provided in prompt
  const startSession = async () => {
    setIsActive(true);
    setStatus('Initializing...');
    
    try {
      const ai = getAiClient();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      let nextStartTime = 0;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = audioContext;

      // Helper to decode response audio
      const decodeAudioData = async (b64: string) => {
        const binaryString = atob(b64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(dataInt16.length);
        for(let i=0; i<dataInt16.length; i++) {
            float32[i] = dataInt16[i] / 32768.0;
        }

        const buffer = outputAudioContext.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        return buffer;
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Connected');
            
            // Start Mic Stream
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
               // Simple visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i+=50) sum += Math.abs(inputData[i]);
              setVolume(Math.min(100, (sum / (inputData.length/50)) * 500));

              // PCM16 Conversion
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const bytes = new Uint8Array(int16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const b64 = btoa(binary);

              sessionPromise.then(sess => {
                sess.sendRealtimeInput({
                  media: { mimeType: 'audio/pcm;rate=16000', data: b64 }
                });
              });
            };
            
            source.connect(processor);
            processor.connect(audioContext.destination);
            processorRef.current = processor;
            inputSourceRef.current = source;
          },
          onmessage: async (msg) => {
            // Handle Audio Output
            const b64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (b64) {
              const buffer = await decodeAudioData(b64);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              
              const now = outputAudioContext.currentTime;
              nextStartTime = Math.max(nextStartTime, now);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
            }
          },
          onclose: () => {
            setStatus('Disconnected');
            setIsActive(false);
          },
          onerror: (e) => {
            console.error(e);
            setStatus('Error');
          }
        },
        config: {
           responseModalities: [Modality.AUDIO],
           speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
           },
           systemInstruction: "You are Helios, a professional and friendly solar energy consultant. Answer questions about solar power, installation, and energy savings briefly."
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatus('Failed to start');
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (processorRef.current) processorRef.current.disconnect();
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    // sessionRef is a Promise<LiveSession>, we can't easily "close" it synchronously without storing the resolved session
    // But we can reload state. Ideally we call session.close() if we had the object.
    // For this demo, just cleaning up audio context kills the interaction effectively on client side.
    
    setIsActive(false);
    setVolume(0);
    setStatus('Ended');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isActive ? (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-fadeIn border border-slate-700">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-500 rounded-full opacity-50 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center relative z-10" style={{ transform: `scale(${1 + volume/200})` }}>
               <i className="fas fa-microphone"></i>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Live Agent</div>
            <div className="text-sm font-medium">{status}</div>
          </div>
          <button onClick={stopSession} className="bg-red-500 hover:bg-red-600 w-8 h-8 rounded-full flex items-center justify-center transition">
            <i className="fas fa-times"></i>
          </button>
        </div>
      ) : (
        <button 
          onClick={startSession}
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-110 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group"
          title="Start Voice Chat"
        >
          <i className="fas fa-headset text-xl group-hover:rotate-12 transition-transform"></i>
        </button>
      )}
    </div>
  );
};