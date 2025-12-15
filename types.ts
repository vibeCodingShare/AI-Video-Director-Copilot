
export enum SceneType {
  ARoll = 'A-Roll',
  BRoll = 'B-Roll',
  Screencast = 'Screencast',
  Macro = 'Macro',
  Infographic = 'Infographic'
}

export enum ShotSize {
  ExtremeWide = 'Extreme Wide',
  Wide = 'Wide',
  Medium = 'Medium',
  CloseUp = 'Close-up',
  ExtremeCloseUp = 'Extreme Close-up'
}

export enum CameraMove {
  Static = 'Static',
  PanLeft = 'Pan Left',
  PanRight = 'Pan Right',
  TiltUp = 'Tilt Up',
  TiltDown = 'Tilt Down',
  ZoomIn = 'Zoom In',
  ZoomOut = 'Zoom Out',
  Dolly = 'Dolly',
  Truck = 'Truck',
  RackFocus = 'Rack Focus'
}

export interface VisualSpec {
  description: string;
  shot_size: string;
  camera_move: string;
  lighting: string;
}

export interface Scene {
  id: number;
  type: SceneType;
  duration_sec: number;
  script: string;
  emotion?: string;
  visual_spec: VisualSpec;
  image_prompt: string;
  editing_note?: string;
  generated_image_url?: string; 
  image_style_preset?: string; 
}

export interface ProjectData {
  project_summary: string;
  scenes: Scene[];
}

export interface ProjectInput {
  title: string;
  persona: string;
  rawContent: string;
  additionalPrompt: string;
  targetDuration: number;
  initialStyleId?: string; 
}

export interface Project {
  id: string;
  title: string;
  persona: string;
  rawContent: string;
  additionalPrompt: string;
  targetDuration: number;
  initialStyleId?: string; 
  createdAt: number;
  data?: ProjectData;
  editingPlan?: EditingPlan;
}

export interface EditingPlanItem {
  sceneId: number;
  transition: string;
  duration: number;
  notes: string;
}

export interface EditingPlan {
  timeline: EditingPlanItem[];
  pacing_notes: string;
}

export interface ImageStyleTemplate {
  id: string;
  name: string;
  prompt: string;
}

export type ModelProvider = 'google' | 'openai-compatible';

export interface ModelConfig {
  id: string;
  name: string; // User defined name e.g. "My DeepSeek"
  provider: ModelProvider;
  apiKey: string;
  baseUrl?: string; // Optional for OpenAI compatible
  modelId: string; // e.g. "gemini-2.5-flash", "gpt-4", "deepseek-chat"
}

export interface AppSettings {
  // 1. Basic Settings
  enableIntentAnalysis: boolean;
  autoGenerateImageOnScript: boolean; 

  // 2. LLM Settings (BYOK)
  textModels: ModelConfig[];
  imageModels: ModelConfig[];
  activeTextModelId: string;
  activeImageModelId: string;
  
  // 3. Prompt Settings
  intentPrompt: string;      
  editingPrompt: string;     

  // 3b. The Director Variables
  directorMainPrompt: string;    
  directorVar_storyboard: string; 
  directorVar_cinematography: string; 
  directorVar_director: string;   
  directorVar_continuity: string; 
  
  // Image Generation Styles
  imageStyleTemplates: ImageStyleTemplate[];
}
