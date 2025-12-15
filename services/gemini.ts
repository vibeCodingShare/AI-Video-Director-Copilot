
import { GoogleGenAI } from "@google/genai";
import { AppSettings, ProjectData, EditingPlan, ModelConfig } from '../types';

// Helper to get the active config
const getActiveTextConfig = (settings: AppSettings): ModelConfig | undefined => {
  return settings.textModels.find(m => m.id === settings.activeTextModelId);
};

const getActiveImageConfig = (settings: AppSettings): ModelConfig | undefined => {
  return settings.imageModels.find(m => m.id === settings.activeImageModelId);
};

// --- GENERIC API CALLERS ---

const callGoogleGenAI = async (
  config: ModelConfig, 
  prompt: string, 
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  const options: any = {
    systemInstruction,
  };
  if (jsonMode) {
    options.responseMimeType = "application/json";
  }

  const response = await ai.models.generateContent({
    model: config.modelId,
    contents: prompt,
    config: options,
  });

  return response.text || "";
};

const callOpenAICompatible = async (
  config: ModelConfig, 
  prompt: string, 
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://api.openai.com/v1';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`
  };

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: config.modelId,
    messages: messages,
  };

  if (jsonMode) {
    // Note: Some providers strictly require "json" in the prompt for json_object mode
    body.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Compatible API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e: any) {
    console.error("OpenAI Call Failed", e);
    throw e;
  }
};

const generateText = async (
  prompt: string, 
  settings: AppSettings, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  const config = getActiveTextConfig(settings);
  if (!config) throw new Error("No active text model configured.");

  if (config.provider === 'google') {
    return callGoogleGenAI(config, prompt, systemInstruction, jsonMode);
  } else {
    return callOpenAICompatible(config, prompt, systemInstruction, jsonMode);
  }
};

// --- IMAGE GENERATION ---

const callGoogleImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
   if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
   const ai = new GoogleGenAI({ apiKey: config.apiKey });
   
   const response = await ai.models.generateContent({
      model: config.modelId,
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in Google response");
};

const callOpenAICompatibleImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://api.openai.com/v1';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`
  };

  const body = {
    model: config.modelId,
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json" 
  };

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Image API Error: ${err}`);
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (b64) {
      return `data:image/png;base64,${b64}`; // Assuming png/jpeg, browser handles it usually if header is approximate
    }
    // Fallback if URL is returned (though we asked for b64)
    const url = data.data?.[0]?.url;
    if (url) return url;

    throw new Error("No image data found in response");
  } catch (e) {
    console.error("OpenAI Image Gen Failed", e);
    throw e;
  }
};

// --- EXPORTED FUNCTIONS ---

export const analyzeIntent = async (
  rawInput: string,
  settings: AppSettings
): Promise<string> => {
  try {
    return await generateText(
      `Raw User Input: "${rawInput}"\n\n${settings.intentPrompt}`, 
      settings
    );
  } catch (error) {
    console.error("Intent analysis error:", error);
    return rawInput;
  }
};

export const generateScript = async (
  userMessage: string,
  settings: AppSettings
): Promise<ProjectData> => {
  
  let systemInstruction = settings.directorMainPrompt;
  systemInstruction = systemInstruction.replace('{{STORYBOARD}}', settings.directorVar_storyboard);
  systemInstruction = systemInstruction.replace('{{CINEMATOGRAPHY}}', settings.directorVar_cinematography);
  systemInstruction = systemInstruction.replace('{{DIRECTOR}}', settings.directorVar_director);
  systemInstruction = systemInstruction.replace('{{CONTINUITY}}', settings.directorVar_continuity);

  // If using OpenAI compatible models, we append "Respond in JSON" explicitly to prompt to be safe, 
  // although json_object mode helps.
  const config = getActiveTextConfig(settings);
  if (config?.provider === 'openai-compatible') {
      systemInstruction += "\n\nIMPORTANT: You must respond with raw JSON only. No markdown formatting.";
  }

  try {
    const text = await generateText(userMessage, settings, systemInstruction, true);
    
    // Robust JSON cleaning
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as ProjectData;
  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
};

export const generateSceneImage = async (
  imagePrompt: string,
  visualDescription: string,
  styleTemplate: string, 
  settings: AppSettings
): Promise<string> => {
  
  let fullPrompt = "";
  if (styleTemplate.includes('{{DESCRIPTION}}')) {
      fullPrompt = styleTemplate.replace('{{DESCRIPTION}}', visualDescription);
  } else {
      fullPrompt = `${styleTemplate}. Subject: ${visualDescription}.`;
  }
  fullPrompt += ` Detail: ${imagePrompt}`;

  const config = getActiveImageConfig(settings);
  if (!config) return `https://picsum.photos/seed/${Math.random()}/800/450`;

  try {
    if (config.provider === 'google') {
      return await callGoogleImageGen(config, fullPrompt);
    } else {
      return await callOpenAICompatibleImageGen(config, fullPrompt);
    }
  } catch (error) {
    console.error("Image generation error:", error);
    return `https://picsum.photos/seed/${Math.random()}/800/450`; 
  }
};

export const generateEditingPlan = async (
  prompt: string,
  settings: AppSettings
): Promise<EditingPlan> => {
  try {
    const text = await generateText(prompt, settings, settings.editingPrompt, true);
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as EditingPlan;
  } catch (error) {
    console.error("Editing plan generation error:", error);
    throw error;
  }
};
