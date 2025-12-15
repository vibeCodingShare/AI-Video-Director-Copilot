
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project, AppSettings, Scene, ProjectInput, EditActionType, EditingPlan } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { analyzeIntent, generateScript, generateEditingPlan, generateSceneImage } from '../services/gemini';
import { buildScriptGenerationPrompt, buildEditingPlanPrompt } from '../utils/promptBuilder';

interface TaskState {
  // Project Creation
  isCreating: boolean;
  creationStatus: 'idle' | 'analyzing' | 'scripting' | 'success';
  creationError: string | null;
  
  // Editing Plan Generation (Set of Project IDs)
  generatingEditPlanIds: Set<string>;
  
  // Image Generation (Set of "projectId-sceneId" strings)
  generatingImageIds: Set<string>;
}

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  settings: AppSettings;
  taskState: TaskState; // Global Task State
  
  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateScene: (projectId: string, sceneId: number, updates: Partial<Scene>) => void;
  setCurrentProjectId: (id: string | null) => void;
  updateSettings: (settings: AppSettings) => void;
  getCurrentProject: () => Project | undefined;
  deleteProject: (id: string) => void;
  importProjects: (projects: Project[]) => void;
  
  // Async Task Launchers
  startProjectCreation: (input: ProjectInput) => Promise<void>;
  resetCreationState: () => void;
  startEditPlanGeneration: (projectId: string) => Promise<void>;
  startSceneImageGeneration: (projectId: string, scene: Scene, styleId: string) => Promise<void>;

  storageError: string | null;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Data Persistence ---
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('vdc_projects');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load projects", e);
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('vdc_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem('vdc_currentProjectId') || null;
  });

  const [storageError, setStorageError] = useState<string | null>(null);

  // --- Global Task State ---
  const [taskState, setTaskState] = useState<TaskState>({
    isCreating: false,
    creationStatus: 'idle',
    creationError: null,
    generatingEditPlanIds: new Set(),
    generatingImageIds: new Set(),
  });

  // --- Persistence Effects ---
  useEffect(() => {
    try {
      localStorage.setItem('vdc_projects', JSON.stringify(projects));
      setStorageError(null);
    } catch (e: any) {
      console.error("Storage Limit Exceeded:", e);
      setStorageError("Storage limit reached. New changes may not persist if you reload. Consider exporting a backup or deleting old projects.");
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('vdc_settings', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  const setCurrentProjectId = (id: string | null) => {
    setCurrentProjectIdState(id);
    if (id) {
      localStorage.setItem('vdc_currentProjectId', id);
    } else {
      localStorage.removeItem('vdc_currentProjectId');
    }
  };

  // --- Synchronous Actions ---

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
    setCurrentProjectId(project.id);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const updateScene = (projectId: string, sceneId: number, updates: Partial<Scene>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId || !p.data) return p;
      const newScenes = p.data.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s);
      return { ...p, data: { ...p.data, scenes: newScenes } };
    }));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) setCurrentProjectId(null);
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const getCurrentProject = () => projects.find(p => p.id === currentProjectId);

  const importProjects = (importedProjects: Project[]) => {
    if (!Array.isArray(importedProjects)) {
      alert("Invalid backup file format.");
      return;
    }
    setProjects(prev => {
        const projectMap = new Map(prev.map(p => [p.id, p]));
        let added = 0; let updated = 0;
        importedProjects.forEach(p => {
            if (projectMap.has(p.id)) updated++; else added++;
            projectMap.set(p.id, p);
        });
        setTimeout(() => alert(`Import Summary:\n• Added: ${added}\n• Updated: ${updated}`), 50);
        return Array.from(projectMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    });
    if (!currentProjectId && importedProjects.length > 0) {
        setCurrentProjectId(importedProjects[0].id);
    }
  };

  // --- Async Task Actions ---

  const startProjectCreation = async (input: ProjectInput) => {
    if (taskState.isCreating) return;

    setTaskState(prev => ({ ...prev, isCreating: true, creationStatus: 'analyzing', creationError: null }));

    try {
      // 1. Intent Analysis
      let finalContent = input.rawContent;
      if (settings.enableIntentAnalysis) {
        try {
          finalContent = await analyzeIntent(input.rawContent, settings);
        } catch (e) {
          console.error("Intent analysis failed silently", e);
        }
      }

      // 2. Script Generation
      setTaskState(prev => ({ ...prev, creationStatus: 'scripting' }));
      
      const processingInput = { ...input, rawContent: finalContent };
      const prompt = buildScriptGenerationPrompt(processingInput);
      const scriptData = await generateScript(prompt, settings);
      
      // Post-process
      if (input.initialStyleId) {
          scriptData.scenes = scriptData.scenes.map(scene => ({
              ...scene,
              image_style_preset: input.initialStyleId
          }));
      }

      const newProject: Project = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        data: scriptData
      };

      addProject(newProject);
      setTaskState(prev => ({ ...prev, isCreating: false, creationStatus: 'success' }));

    } catch (err: any) {
      console.error(err);
      setTaskState(prev => ({ 
        ...prev, 
        isCreating: false, 
        creationStatus: 'idle', 
        creationError: err.message || "Failed to generate project" 
      }));
      alert(`Error: ${err.message || 'Unknown error'}`);
    }
  };

  const resetCreationState = () => {
    setTaskState(prev => ({ ...prev, creationStatus: 'idle', creationError: null }));
  };

  const startEditPlanGeneration = async (projectId: string) => {
    setTaskState(prev => {
        const newSet = new Set(prev.generatingEditPlanIds);
        newSet.add(projectId);
        return { ...prev, generatingEditPlanIds: newSet };
    });

    try {
      const project = projects.find(p => p.id === projectId);
      if (!project || !project.data) throw new Error("Project data missing");

      // Cleanse data to save tokens
      const cleanScenes = project.data.scenes.map(({ generated_image_url, ...rest }) => rest);
      const cleanProjectData = { ...project.data, scenes: cleanScenes };

      const prompt = buildEditingPlanPrompt(cleanProjectData);
      const plan = await generateEditingPlan(prompt, settings);
      
      updateProject(projectId, { editingPlan: plan });

    } catch (e: any) {
      console.error(e);
      alert("Failed to generate editing plan.");
    } finally {
        setTaskState(prev => {
            const newSet = new Set(prev.generatingEditPlanIds);
            newSet.delete(projectId);
            return { ...prev, generatingEditPlanIds: newSet };
        });
    }
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
       
       const imageUrl = await generateSceneImage(
         scene.image_prompt,
         scene.visual_spec.description,
         stylePrompt,
         settings
       );

       updateScene(projectId, scene.id, {
           generated_image_url: imageUrl,
           image_style_preset: styleId
       });

    } catch (e: any) {
        if (e.message.includes("No active image model")) {
            alert("Please configure an Image Generation Model in Settings.");
        } else {
            console.error("Image Gen Failed:", e);
            alert(`Failed to generate image: ${e.message}`);
        }
    } finally {
        setTaskState(prev => {
            const newSet = new Set(prev.generatingImageIds);
            newSet.delete(key);
            return { ...prev, generatingImageIds: newSet };
        });
    }
  };

  return (
    <AppContext.Provider value={{
      projects,
      currentProjectId,
      settings,
      storageError,
      taskState,
      addProject,
      updateProject,
      updateScene,
      setCurrentProjectId,
      updateSettings,
      getCurrentProject,
      deleteProject,
      importProjects,
      startProjectCreation,
      resetCreationState,
      startEditPlanGeneration,
      startSceneImageGeneration
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
