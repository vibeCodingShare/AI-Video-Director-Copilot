import React, { useState, useEffect } from 'react';
import { AppProvider, useAppStore } from './store/AppContext';
import Layout from './components/Layout';
import ProjectInput from './components/ProjectInput';
import ScriptBoard from './components/ScriptBoard';
import EditingTimeline from './components/EditingTimeline';
import SettingsView from './components/SettingsView';
import { LayoutGrid, Scissors } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentProjectId } = useAppStore();
  
  // View state: 'create' | 'settings' | 'script' | 'edit'
  // 'script' and 'edit' are sub-views of a selected project
  const [view, setViewState] = useState<'create' | 'script' | 'edit' | 'settings'>(() => {
    return (localStorage.getItem('vdc_activeView') as any) || 'create';
  });

  const setView = (v: 'create' | 'script' | 'edit' | 'settings') => {
    setViewState(v);
    localStorage.setItem('vdc_activeView', v);
  };

  // If we are in project mode (script/edit), we show the Tabs at the top of the main area
  const showProjectTabs = currentProjectId && (view === 'script' || view === 'edit');

  useEffect(() => {
     // If user deleted the current project, fallback to create
     if (!currentProjectId && (view === 'script' || view === 'edit')) {
         setView('create');
     }
     // If user just created a project (logic handled in ProjectInput usually), 
     // but here we ensure if currentProjectId is set and we were in 'create', we switch to 'script'
     // Wait, we don't want to force switch if user is navigating history.
     // ProjectInput handles the switch on creation success.
  }, [currentProjectId]);

  return (
    <Layout view={view} setView={setView}>
      {view === 'create' && <ProjectInput />}
      {view === 'settings' && <SettingsView />}
      
      {showProjectTabs && (
        <div className="flex flex-col h-full">
            {/* Project Tabs */}
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

            {/* Content Area */}
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
