import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, AppSettings, Scene } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  settings: AppSettings;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateScene: (projectId: string, sceneId: number, updates: Partial<Scene>) => void;
  setCurrentProjectId: (id: string | null) => void;
  updateSettings: (settings: AppSettings) => void;
  getCurrentProject: () => Project | undefined;
  deleteProject: (id: string) => void;
  importProjects: (projects: Project[]) => void;
  storageError: string | null;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const [storageError, setStorageError] = useState<string | null>(null);

  // Load persisted current project ID
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem('vdc_currentProjectId') || null;
  });

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

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
    setCurrentProjectId(project.id);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Atomic update for a scene to prevent race conditions with multiple async image generations
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
    // Basic validation
    if (!Array.isArray(importedProjects)) {
      alert("Invalid backup file format.");
      return;
    }

    setProjects(prev => {
        const projectMap = new Map(prev.map(p => [p.id, p]));
        let added = 0;
        let updated = 0;

        importedProjects.forEach(p => {
            if (projectMap.has(p.id)) {
                updated++;
            } else {
                added++;
            }
            // Add or Overwrite (if same ID)
            projectMap.set(p.id, p);
        });
        
        setTimeout(() => {
             alert(`Import Summary:\n• Added: ${added} projects\n• Updated: ${updated} projects`);
        }, 50);

        // Sort by newest first
        const newProjectList = Array.from(projectMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        
        return newProjectList;
    });

    // Automatically select the first imported project if no project is currently selected
    if (!currentProjectId && importedProjects.length > 0) {
        setCurrentProjectId(importedProjects[0].id);
    }
  };

  return (
    <AppContext.Provider value={{
      projects,
      currentProjectId,
      settings,
      storageError,
      addProject,
      updateProject,
      updateScene,
      setCurrentProjectId,
      updateSettings,
      getCurrentProject,
      deleteProject,
      importProjects
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