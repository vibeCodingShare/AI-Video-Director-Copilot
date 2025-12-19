
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, AppSettings, Scene, ProjectInput, EditingPlan, ModelConfig } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { analyzeIntent, generateScript, generateEditingPlan, generateSceneImage } from '../services/gemini';
import { buildScriptGenerationPrompt, buildEditingPlanPrompt } from '../utils/promptBuilder';
import { dbService } from '../services/db';

interface TaskState {
  isCreating: boolean;
  creationStatus: 'idle' | 'analyzing' | 'scripting' | 'success';
  creationError: string | null;
  generatingEditPlanIds: Set<string>;
  generatingImageIds: Set<string>;
}

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  settings: AppSettings;
  taskState: TaskState;
  isLoadingData: boolean;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateScene: (projectId: string, sceneId: number, updates: Partial<Scene>) => void;
  setCurrentProjectId: (id: string | null) => void;
  updateSettings: (settings: AppSettings) => void;
  getCurrentProject: () => Project | undefined;
  deleteProject: (id: string) => void;
  importProjects: (projects: Project[]) => void;
  startProjectCreation: (input: ProjectInput) => Promise<void>;
  resetCreationState: () => void;
  startEditPlanGeneration: (projectId: string) => Promise<void>;
  startSceneImageGeneration: (projectId: string, scene: Scene, styleId: string) => Promise<void>;
  storageError: string | null;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem('vdc_currentProjectId') || null;
  });
  const [storageError, setStorageError] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<TaskState>({
    isCreating: false,
    creationStatus: 'idle',
    creationError: null,
    generatingEditPlanIds: new Set(),
    generatingImageIds: new Set(),
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [loadedProjects, loadedSettings] = await Promise.all([
            dbService.getAllProjects(),
            dbService.getSettings()
        ]);
        setProjects(loadedProjects);
        setSettings(loadedSettings);
      } catch (e) {
        console.error("Failed to load data from IndexedDB:", e);
        setStorageError("Failed to load database. Please refresh.");
      } finally {
        setIsLoadingData(false);
      }
    };
    init();
  }, []);

  const setCurrentProjectId = (id: string | null) => {
    setCurrentProjectIdState(id);
    if (id) localStorage.setItem('vdc_currentProjectId', id);
    else localStorage.removeItem('vdc_currentProjectId');
  };

  const addProject = async (project: Project) => {
    setProjects(prev => [project, ...prev]);
    setCurrentProjectId(project.id);
    try { await dbService.saveProject(project); } catch (e) { setStorageError("Failed to save project."); }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    let updatedProjectFull: Project | undefined;
    setProjects(prev => prev.map(p => {
        if (p.id === id) {
            updatedProjectFull = { ...p, ...updates };
            return updatedProjectFull;
        }
        return p;
    }));
    if (updatedProjectFull) {
        try { await dbService.saveProject(updatedProjectFull); } catch (e) { setStorageError("Failed to save project."); }
    }
  };

  const updateScene = async (projectId: string, sceneId: number, updates: Partial<Scene>) => {
    let updatedProjectFull: Project | undefined;
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId || !p.data) return p;
      const newScenes = p.data.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s);
      updatedProjectFull = { ...p, data: { ...p.data, scenes: newScenes } };
      return updatedProjectFull;
    }));
    if (updatedProjectFull) {
        try { await dbService.saveProject(updatedProjectFull); } catch (e) { setStorageError("Failed to save scene."); }
    }
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) setCurrentProjectId(null);
    try { await dbService.deleteProject(id); } catch (e) { console.error(e); }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try { await dbService.saveSettings(newSettings); } catch (e) { setStorageError("Failed to save settings."); }
  };

  const getCurrentProject = () => projects.find(p => p.id === currentProjectId);

  const importProjects = async (importedProjects: Project[]) => {
    try {
        await dbService.importProjects(importedProjects);
        const freshProjects = await dbService.getAllProjects();
        setProjects(freshProjects);
        if (!currentProjectId && freshProjects.length > 0) setCurrentProjectId(freshProjects[0].id);
    } catch (e) { console.error(e); }
  };

  const startSceneImageGeneration = async (projectId: string, scene: Scene, styleId: string) => {
    const key = `${projectId}-${scene.id}`;
    setTaskState(prev => {
        const newSet = new Set(prev.generatingImageIds);
        newSet.add(key);
        return { ...prev, generatingImageIds: newSet };
    });
    try {
       const styleTemplate = settings.imageStyleTemplates.find(t => t.id === styleId);
       const stylePrompt = styleTemplate ? styleTemplate.prompt : "Photorealistic";
       const imageUrl = await generateSceneImage(scene.image_prompt, scene.visual_spec.description, stylePrompt, settings);
       await updateScene(projectId, scene.id, { generated_image_url: imageUrl, image_style_preset: styleId });
    } catch (e) { console.error("Image Gen Failed:", e); } finally {
        setTaskState(prev => {
            const newSet = new Set(prev.generatingImageIds);
            newSet.delete(key);
            return { ...prev, generatingImageIds: newSet };
        });
    }
  };

  const processImageBatch = async (projectId: string, scenes: Scene[], styleId: string) => {
    for (const scene of scenes) {
        if (scene.generated_image_url) continue;
        await startSceneImageGeneration(projectId, scene, styleId);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const startProjectCreation = async (input: ProjectInput) => {
    if (taskState.isCreating) return;
    setTaskState(prev => ({ ...prev, isCreating: true, creationStatus: 'analyzing', creationError: null }));
    try {
      let finalContent = input.rawContent;
      if (settings.enableIntentAnalysis) {
        try { finalContent = await analyzeIntent(input.rawContent, settings); } catch (e) { console.error(e); }
      }
      setTaskState(prev => ({ ...prev, creationStatus: 'scripting' }));
      const processingInput = { ...input, rawContent: finalContent };
      const prompt = buildScriptGenerationPrompt(processingInput);
      const scriptData = await generateScript(prompt, settings);
      if (input.initialStyleId) {
          scriptData.scenes = scriptData.scenes.map(scene => ({ ...scene, image_style_preset: input.initialStyleId }));
      }
      const newProject: Project = { ...input, id: crypto.randomUUID(), createdAt: Date.now(), data: scriptData };
      await addProject(newProject);
      setTaskState(prev => ({ ...prev, isCreating: false, creationStatus: 'success' }));
      if (settings.autoGenerateImageOnScript && scriptData.scenes.length > 0) {
          const styleId = input.initialStyleId || settings.imageStyleTemplates[0]?.id || 'cinematic';
          processImageBatch(newProject.id, scriptData.scenes, styleId);
      }
    } catch (err: any) {
      setTaskState(prev => ({ ...prev, isCreating: false, creationStatus: 'idle', creationError: err.message || "Failed" }));
      alert(`Error: ${err.message}`);
    }
  };

  const resetCreationState = () => setTaskState(prev => ({ ...prev, creationStatus: 'idle', creationError: null }));

  const startEditPlanGeneration = async (projectId: string) => {
    setTaskState(prev => {
        const newSet = new Set(prev.generatingEditPlanIds);
        newSet.add(projectId);
        return { ...prev, generatingEditPlanIds: newSet };
    });
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project || !project.data) throw new Error("Missing data");
      const cleanScenes = project.data.scenes.map(({ generated_image_url, ...rest }) => rest);
      const prompt = buildEditingPlanPrompt({ ...project.data, scenes: cleanScenes });
      const plan = await generateEditingPlan(prompt, settings);
      await updateProject(projectId, { editingPlan: plan });
    } catch (e) { alert("Failed to generate plan."); } finally {
        setTaskState(prev => {
            const newSet = new Set(prev.generatingEditPlanIds);
            newSet.delete(projectId);
            return { ...prev, generatingEditPlanIds: newSet };
        });
    }
  };

  return (
    <AppContext.Provider value={{
      projects, currentProjectId, settings, storageError, taskState, isLoadingData,
      addProject, updateProject, updateScene, setCurrentProjectId, updateSettings,
      getCurrentProject, deleteProject, importProjects, startProjectCreation,
      resetCreationState, startEditPlanGeneration, startSceneImageGeneration
    }}>
      {isLoadingData ? <div className="h-screen w-full flex items-center justify-center bg-background text-gray-500">Loading Database...</div> : children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
