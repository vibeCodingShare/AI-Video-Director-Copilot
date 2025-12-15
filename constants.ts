
import { AppSettings, SceneType, ModelConfig } from './types';

const DEFAULT_INTENT_PROMPT = `
Role: You are an expert Creative Producer and Requirements Analyst.
Task: Analyze the user's raw input to extract the core creative intent. 

Output a structured summary that includes:
1. Core Message (The "Why")
2. Target Audience (The "Who")
3. Key Plot Points/Information Hierarchy (The "What")
4. Suggested Tone/Mood (The "How")

Constraint: Do not write the script yet. Only refine the requirements to help the Director AI write a better script later.
`;

const DEFAULT_DIRECTOR_MAIN_PROMPT = `
Role: You are a world-class Video Director and Creative Lead.
Goal: Convert requirements into a professional shooting script JSON.

# TEAM ROLES & GUIDELINES

## I. DIRECTOR'S VISION (Tone & Performance)
{{DIRECTOR}}

## II. VISUAL LANGUAGE (Cinematography)
{{CINEMATOGRAPHY}}

## III. STORYBOARDING RULES (Content & Structure)
{{STORYBOARD}}

## IV. CONTINUITY & FLOW (Script Supervisor)
{{CONTINUITY}}

# GLOBAL CONSTRAINTS
1. **LANGUAGE**: The 'script', 'visual_spec.description', and 'emotion' fields in the output JSON **MUST BE IN CHINESE (SIMPLIFIED)**.
2. **FORMAT**: You must strictly output valid JSON matching the defined schema.
`;

const DEFAULT_VAR_STORYBOARD = `
- Categorize every scene accurately (A-Roll for speaking, B-Roll for context, Screencast for demos).
- Visual Presentation: Ensure the visual content matches the spoken audio. If the audio is abstract, provide concrete visual metaphors.
`;

const DEFAULT_VAR_CINEMATOGRAPHY = `
- Shot Size: Use 'Wide' for establishing context, 'Medium' for information, 'Close-up' for emotion or emphasis.
- Camera Move: Use 'Static' for stability, 'Pan' for revealing, 'Zoom In' for focus. Avoid unmotivated movement.
- Lighting: Define the mood (e.g., 'Natural', 'Cyberpunk', 'Studio Softbox').
`;

const DEFAULT_VAR_DIRECTOR = `
- Emotion: Explicitly label the emotion of the speaker or the vibe of the scene (e.g., 'Excited', 'Serious', 'Contemplative').
- Dialogue: Write natural, spoken-word scripts. Avoid robotic phrasing. Include pauses [pause] where necessary.
`;

const DEFAULT_VAR_CONTINUITY = `
- Flow: Ensure the transition from the previous scene to the current one is logical.
- Details: If a prop appears in Scene 1, ensure it doesn't vanish in Scene 2 unless intended.
`;

const DEFAULT_EDITING_PROMPT = `
Role: You are a Senior Video Editor (ACE).
Task: Create an editing decision list (EDL) and pacing plan based on the provided script.
Output: A JSON containing 'pacing_notes' and a 'timeline' array.
`;

const DEFAULT_IMAGE_TEMPLATES = [
  { 
      id: 'cinematic', 
      name: 'Cinematic (Default)', 
      prompt: 'A cinematic shot of {{DESCRIPTION}}. Professional photography, ARRI Alexa, 50mm lens, depth of field, photorealistic, 8k, dramatic lighting.' 
  },
  { 
      id: 'anime', 
      name: 'Anime Style', 
      prompt: 'Anime key visual of {{DESCRIPTION}}. Makoto Shinkai style, vibrant colors, beautiful clouds, high quality 2D animation, detailed background.' 
  },
  { 
      id: 'lineart', 
      name: 'Storyboard Sketch', 
      prompt: 'Rough black and white storyboard sketch of {{DESCRIPTION}}. Pencil drawing on paper, loose lines, concept art, minimal details.' 
  },
  { 
      id: 'cyberpunk', 
      name: 'Cyberpunk/Neon', 
      prompt: 'Futuristic cyberpunk shot of {{DESCRIPTION}}. Neon lights, rain-slicked streets, purple and blue color palette, high contrast, blade runner aesthetic.' 
  },
  { 
      id: 'minimal', 
      name: 'Corporate Vector', 
      prompt: 'Flat vector illustration of {{DESCRIPTION}}. Corporate memphis style, minimal, clean solid colors, white background, tech startup aesthetic.' 
  },
];

// Initial Model Configs
const DEFAULT_TEXT_MODELS: ModelConfig[] = [
  {
    id: 'default-gemini-text',
    name: 'Gemini 2.5 Flash (Google)',
    provider: 'google',
    apiKey: process.env.API_KEY || '',
    modelId: 'gemini-2.5-flash'
  }
];

const DEFAULT_IMAGE_MODELS: ModelConfig[] = [
  {
    id: 'default-gemini-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'google',
    apiKey: process.env.API_KEY || '',
    modelId: 'gemini-2.5-flash-image'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  // Basic
  enableIntentAnalysis: true,
  autoGenerateImageOnScript: false,

  // LLM (BYOK)
  textModels: DEFAULT_TEXT_MODELS,
  imageModels: DEFAULT_IMAGE_MODELS,
  activeTextModelId: 'default-gemini-text',
  activeImageModelId: 'default-gemini-image',

  // Prompts
  intentPrompt: DEFAULT_INTENT_PROMPT.trim(),
  editingPrompt: DEFAULT_EDITING_PROMPT.trim(),
  
  // Director Variables
  directorMainPrompt: DEFAULT_DIRECTOR_MAIN_PROMPT.trim(),
  directorVar_storyboard: DEFAULT_VAR_STORYBOARD.trim(),
  directorVar_cinematography: DEFAULT_VAR_CINEMATOGRAPHY.trim(),
  directorVar_director: DEFAULT_VAR_DIRECTOR.trim(),
  directorVar_continuity: DEFAULT_VAR_CONTINUITY.trim(),

  imageStyleTemplates: DEFAULT_IMAGE_TEMPLATES,
};

export const SCENE_TYPE_COLORS: Record<SceneType, string> = {
  [SceneType.ARoll]: 'bg-blue-900 border-blue-700 text-blue-100',
  [SceneType.BRoll]: 'bg-emerald-900 border-emerald-700 text-emerald-100',
  [SceneType.Screencast]: 'bg-purple-900 border-purple-700 text-purple-100',
  [SceneType.Macro]: 'bg-amber-900 border-amber-700 text-amber-100',
  [SceneType.Infographic]: 'bg-pink-900 border-pink-700 text-pink-100',
};

export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  [SceneType.ARoll]: 'A-Roll (Speaker)',
  [SceneType.BRoll]: 'B-Roll (Atmosphere)',
  [SceneType.Screencast]: 'Screencast (Demo)',
  [SceneType.Macro]: 'Macro (Detail)',
  [SceneType.Infographic]: 'Infographic (Data)',
};
