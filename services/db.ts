
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface DirectorDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-created': number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'ai-director-db';
const DB_VERSION = 1;
const SETTINGS_KEY = 'global_settings';

let dbPromise: Promise<IDBPDatabase<DirectorDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<DirectorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create Projects Store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-created', 'createdAt');
        }
        // Create Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
};

// --- API ---

export const dbService = {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    const db = await getDB();
    const projects = await db.getAllFromIndex('projects', 'by-created');
    // IndexedDB returns ascending, we usually want descending (newest first)
    return projects.reverse();
  },

  async saveProject(project: Project): Promise<void> {
    const db = await getDB();
    await db.put('projects', project);
  },

  async deleteProject(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', id);
  },

  async importProjects(projects: Project[]): Promise<void> {
      const db = await getDB();
      const tx = db.transaction('projects', 'readwrite');
      await Promise.all(projects.map(p => tx.store.put(p)));
      await tx.done;
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const db = await getDB();
    const settings = await db.get('settings', SETTINGS_KEY);
    return settings || DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await getDB();
    await db.put('settings', settings, SETTINGS_KEY);
  }
};
