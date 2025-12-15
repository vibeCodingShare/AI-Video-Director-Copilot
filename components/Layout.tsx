
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { Video, Settings, PlusCircle, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import HistoryView from './HistoryView';

interface LayoutProps {
  view: 'create' | 'script' | 'edit' | 'settings';
  setView: (view: 'create' | 'script' | 'edit' | 'settings') => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ view, setView, children }) => {
  const { currentProjectId, setCurrentProjectId } = useAppStore();
  const [isSidebarOpen, setSidebarOpen] = useState(true); // Desktop state
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile state

  // Close mobile menu when view changes (e.g. user selects a project)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [view, currentProjectId]);

  return (
    <div className="flex flex-col h-screen bg-background text-gray-300 font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-gray-800 bg-surface flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-3 text-white">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="md:hidden p-1 text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="hidden md:block text-gray-400 hover:text-white transition-colors"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
             {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
                <Video size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">Director.ai</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => { setCurrentProjectId(null); setView('create'); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${view === 'create' && !currentProjectId ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">New Project</span>
          </button>
          
          <button
            onClick={() => setView('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${view === 'settings' ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Config</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar (Collapsible) */}
        <div 
            className={`hidden md:flex flex-col border-r border-gray-800 bg-surface/50 transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
            }`}
        >
           <HistoryView currentView={view} setView={setView} />
        </div>

        {/* Mobile Drawer (Overlay) */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex justify-start">
                 {/* Backdrop */}
                 <div 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
                    onClick={() => setMobileMenuOpen(false)} 
                 />
                 
                 {/* Drawer Content */}
                 <div className="relative w-4/5 max-w-xs bg-surface h-full shadow-2xl animate-in slide-in-from-left duration-300 border-r border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
                        <span className="font-bold text-white flex items-center gap-2">
                            <Video size={16} className="text-primary"/> Projects
                        </span>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <HistoryView currentView={view} setView={setView} />
                    </div>
                 </div>
            </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background relative w-full">
           {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;