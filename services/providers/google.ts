
import { GoogleGenAI } from "@google/genai";
import { ModelConfig } from '../../types';

export const callGoogleGenAI = async (
  config: ModelConfig, 
  prompt: string, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  const genConfig: any = {};
  if (jsonMode) {
    genConfig.responseMimeType = "application/json";
  }
  if (systemInstruction) {
    genConfig.systemInstruction = systemInstruction;
  }

  // Strictly following generateContent parameters
  const response = await ai.models.generateContent({
    model: config.modelId,
    contents: prompt,
    config: genConfig,
  });

  return response.text || "";
};

export const callGoogleImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
   if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
   const ai = new GoogleGenAI({ apiKey: config.apiKey });
   
   // image generation with nano banana series models
   const response = await ai.models.generateContent({
      model: config.modelId,
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in Google response parts");
};
