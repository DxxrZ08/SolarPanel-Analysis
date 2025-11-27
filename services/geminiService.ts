import { GoogleGenAI, Modality } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Basic Report (Flash) ---
export const generateSolarReport = async (data: AnalysisResult, userNeeds: number) => {
  const prompt = `
    Act as a senior Solar Energy Consultant. Analyze the following solar data for a location at Lat: ${data.location.lat}, Lon: ${data.location.lon}.
    
    Data Summary:
    - Average Daily Solar Radiation: ${data.averageRadiation.toFixed(2)} kWh/m²/day
    - User Required Energy: ${userNeeds} kWh/day
    - Estimated Panels Required: ${data.panelsRequired}
    - Optimal Tilt: ${data.optimalTilt.toFixed(2)} degrees
    
    Please provide a concise but professional report covering:
    1. **Feasibility Assessment**: Is this location viable for the user's energy needs?
    2. **Optimization Strategy**: How should they position panels (mention the calculated tilt)?
    3. **Potential Risks**: Based on the latitude and radiation avg, are there seasonal concerns?
    
    Format the output in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI report at this time. Please check API configuration.";
  }
};

// --- Deep Analysis (Thinking Model) ---
export const generateDeepSolarReport = async (data: AnalysisResult) => {
  const prompt = `
    Conduct a rigorous, deep-dive engineering analysis for a proposed solar installation at Lat: ${data.location.lat}, Lon: ${data.location.lon}.
    
    Technical Context:
    - Avg Radiation: ${data.averageRadiation.toFixed(3)} kWh/m²/day.
    - Max Radiation: ${data.maxRadiation.toFixed(3)} kWh/m²/day.
    - Min Radiation: ${data.minRadiation.toFixed(3)} kWh/m²/day.
    - Optimal Tilt: ${data.optimalTilt.toFixed(1)}°.
    
    Task:
    Provide a detailed engineering breakdown including:
    1. Theoretical vs. Real-world efficiency loss factors specific to this latitude.
    2. A critical evaluation of the daily variance (Min vs Max) and what it implies for battery storage sizing.
    3. A specific recommendation on inverter sizing relative to the peak radiation.
    
    Think step-by-step about the physics and meteorology involved.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Thinking API Error:", error);
    return "Deep analysis failed. Please try again later.";
  }
};

// --- Maps Grounding ---
export const findInstallers = async (lat: number, lon: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Find the top rated solar panel installers and solar equipment suppliers near this location.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          googleMaps: {
             capabilities: ['places']
          }
        }
      }
    });
    // Maps grounding returns clean text with links usually
    return response.text || "No installers found nearby.";
  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return "Unable to search for installers right now.";
  }
};

// --- TTS (Text to Speech) ---
export const speakText = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};

// --- Chat (Standard) ---
export const chatWithSolarExpert = async (
  message: string, 
  contextData: AnalysisResult, 
  history: { role: string; content: string }[]
) => {
  const systemContext = `
    You are Helios, a helpful Solar Energy Assistant. 
    Context: user is at Lat ${contextData.location.lat}, Lon ${contextData.location.lon}.
    Avg Radiation: ${contextData.averageRadiation.toFixed(2)}.
    Panels needed: ${contextData.panelsRequired}.
    Keep answers short, helpful, and scientific.
    You can use Google Search if the user asks for current incentives, news, or specific product prices.
  `;

  try {
    // We recreate chat context for each turn in this simple demo structure
    // but in a real app, persist the chat object. 
    // We add googleSearch tool for grounding.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemContext + "\n\nHistoric conversation:\n" + JSON.stringify(history) }] },
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the solar database right now.";
  }
};

// --- Export AI Client for Live API ---
export const getAiClient = () => ai;
