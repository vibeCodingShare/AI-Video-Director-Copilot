
import React from 'react';
import { useAppStore } from '../store/AppContext';
import { Video, Settings, PlusCircle } from 'lucide-react';
import HistoryView from './HistoryView';

interface LayoutProps {
  view: 'create' | 'script' | 'edit' | 'settings';
  setView: (view: 'create' | 'script' | 'edit' | 'settings') => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ view, setView, children }) => {
  const { currentProjectId, setCurrentProjectId } = useAppStore();

  return (
    <div className="flex flex-col h-screen bg-background text-gray-300 font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-gray-800 bg-surface flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3 text-white">
          <div className="bg-primary p-1.5 rounded-lg">
              <Video size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Director.ai</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => { setCurrentProjectId(null); setView('create'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${view === 'create' && !currentProjectId ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
            <PlusCircle size={16} />
            <span>New Project</span>
          </button>
          
          <button
            onClick={() => setView('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${view === 'settings' ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
            <Settings size={16} />
            <span>Configuration</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <HistoryView currentView={view} setView={setView} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
           {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
