
import React, { useState, useEffect } from 'react';
import { AppProvider, useAppStore } from './store/AppContext';
import Layout from './components/Layout';
import ProjectInput from './components/ProjectInput';
import ScriptBoard from './components/ScriptBoard';
import EditingTimeline from './components/EditingTimeline';
import SettingsView from './components/SettingsView';
import AboutView from './components/AboutView';
import { LayoutGrid, Scissors } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentProjectId } = useAppStore();
  
  // View state: 'create' | 'settings' | 'script' | 'edit' | 'about'
  const [view, setViewState] = useState<'create' | 'script' | 'edit' | 'settings' | 'about'>(() => {
    return (localStorage.getItem('vdc_activeView') as any) || 'create';
  });

  const setView = (v: 'create' | 'script' | 'edit' | 'settings' | 'about') => {
    setViewState(v);
    localStorage.setItem('vdc_activeView', v);
  };

  const showProjectTabs = currentProjectId && (view === 'script' || view === 'edit');

  useEffect(() => {
     if (!currentProjectId && (view === 'script' || view === 'edit')) {
         setView('create');
     }
  }, [currentProjectId]);

  return (
    <Layout view={view} setView={setView}>
      {view === 'create' && (
        <ProjectInput onSuccess={() => setView('script')} />
      )}
      {view === 'settings' && <SettingsView />}
      {view === 'about' && <AboutView />}
      
      {showProjectTabs && (
        <div className="flex flex-col h-full">
            <div className="flex items-center px-6 pt-4 border-b border-gray-800 bg-surface/30 backdrop-blur-sm gap-8 shrink-0">
                <button 
                    onClick={() => setView('script')}
                    className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                        view === 'script' 
                        ? 'border-primary text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    <LayoutGrid size={16} />
                    Scene Script
                </button>
                <button 
                    onClick={() => setView('edit')}
                    className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                        view === 'edit' 
                        ? 'border-primary text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    <Scissors size={16} />
                    Auto-Edit Plan
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-black/20">
                {view === 'script' && <ScriptBoard />}
                {view === 'edit' && <EditingTimeline />}
            </div>
        </div>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
