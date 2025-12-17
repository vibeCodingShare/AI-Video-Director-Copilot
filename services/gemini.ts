
import { AppSettings, ProjectData, EditingPlan, ModelConfig } from '../types';
import { callGoogleGenAI, callGoogleImageGen } from './providers/google';
import { callOpenAICompatible, callOpenAICompatibleImageGen } from './providers/openai';
import { callJimengVisualGen } from './providers/jimeng';
import { callKlingImageGen } from './providers/kling';
import { callAnthropicText } from './providers/anthropic';

// --- CONFIG HELPERS ---

const getActiveTextConfig = (settings: AppSettings): ModelConfig | undefined => {
  return settings.textModels.find(m => m.id === settings.activeTextModelId);
};

const getActiveImageConfig = (settings: AppSettings): ModelConfig | undefined => {
  return settings.imageModels.find(m => m.id === settings.activeImageModelId);
};

// --- ORCHESTRATORS ---

const generateText = async (
  prompt: string, 
  settings: AppSettings, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  const config = getActiveTextConfig(settings);
  if (!config) throw new Error("No active text model configured.");

  switch (config.provider) {
    case 'google':
      return callGoogleGenAI(config, prompt, systemInstruction, jsonMode);
    case 'claude':
      return callAnthropicText(config, prompt, systemInstruction, jsonMode);
    case 'deepseek':
    case 'qianwen':
    case 'moonshot':
    case 'minimax':
    case 'grok':
    case 'openai-compatible':
    case 'jimeng': // Fallback safe
    case 'kling': // Fallback safe
    default:
      // Minimax, Grok, and others support OpenAI compatible endpoints
      return callOpenAICompatible(config, prompt, systemInstruction, jsonMode);
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
  if (!config) {
      throw new Error("No active image model configured. Please check Settings.");
  }

  try {
    switch (config.provider) {
      case 'google':
        return await callGoogleImageGen(config, fullPrompt);
      case 'jimeng':
        return await callJimengVisualGen(config, fullPrompt);
      case 'kling':
        return await callKlingImageGen(config, fullPrompt);
      case 'openai-compatible':
      default:
        // DeepSeek/Qianwen/Moonshot/Minimax/Grok/Claude usually don't support standard OpenAI Image API
        // or require specific handling not yet implemented.
        // We route to OpenAI Compatible as a catch-all if user manually selects them for image.
        return await callOpenAICompatibleImageGen(config, fullPrompt);
    }
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

// --- HIGH LEVEL BUSINESS LOGIC ---

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

  const config = getActiveTextConfig(settings);
  
  // Providers that need explicit JSON prompting or benefit from it
  const isJsonInstructionNeeded = 
     config?.provider === 'openai-compatible' || 
     config?.provider === 'jimeng' ||
     config?.provider === 'deepseek' ||
     config?.provider === 'qianwen' ||
     config?.provider === 'moonshot' ||
     config?.provider === 'minimax' ||
     config?.provider === 'grok' ||
     config?.provider === 'claude';

  if (isJsonInstructionNeeded) {
      systemInstruction += "\n\nIMPORTANT: You must respond with raw JSON only. No markdown formatting. No code blocks.";
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
