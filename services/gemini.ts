
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

/**
 * Utility to inject library variables into the main prompt template.
 * Uses a global regex to ensure all occurrences of {{VAR}} are replaced.
 */
const injectVariables = (template: string, settings: AppSettings): string => {
  let result = template;
  const mappings: Record<string, string> = {
    '{{STORYBOARD}}': settings.directorVar_storyboard,
    '{{CINEMATOGRAPHY}}': settings.directorVar_cinematography,
    '{{DIRECTOR}}': settings.directorVar_director,
    '{{CONTINUITY}}': settings.directorVar_continuity,
  };

  Object.entries(mappings).forEach(([placeholder, value]) => {
    // Escape special regex chars just in case, though placeholders are simple
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  });

  return result;
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
    default:
      // Handles deepseek, qianwen, moonshot, minimax, grok, and custom openai
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
      `User's Raw Creative Content: "${rawInput}"\n\nTask: Analyze this content and extract the creative essence as per the provided Intent Analysis Workflow instructions.`, 
      settings,
      settings.intentPrompt
    );
  } catch (error) {
    console.error("Intent analysis failed, using raw input.", error);
    return rawInput;
  }
};

export const generateScript = async (
  userMessage: string,
  settings: AppSettings
): Promise<ProjectData> => {
  
  // 1. Prepare System Instruction with injected knowledge variables
  const finalSystemInstruction = injectVariables(settings.directorMainPrompt, settings);

  const config = getActiveTextConfig(settings);
  
  // 2. Adjust for providers that might not handle system roles natively via SDK
  // or that need JSON format reinforcement
  let enhancedPrompt = userMessage;
  const isJsonInstructionNeeded = config?.provider !== 'google'; 

  if (isJsonInstructionNeeded) {
      enhancedPrompt += "\n\nCRITICAL: Respond ONLY with valid JSON. No conversational text. No markdown formatting.";
  }

  try {
    const text = await generateText(enhancedPrompt, settings, finalSystemInstruction, true);
    
    // 3. Robust JSON cleaning for models that still include markdown backticks
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
