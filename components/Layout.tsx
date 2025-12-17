
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { Video, Settings, PlusCircle, Menu, PanelLeftClose, PanelLeftOpen, X, Sparkles } from 'lucide-react';
import HistoryView from './HistoryView';
import { translations } from '../translations';

interface LayoutProps {
  view: 'create' | 'script' | 'edit' | 'settings' | 'about';
  setView: (view: 'create' | 'script' | 'edit' | 'settings' | 'about') => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ view, setView, children }) => {
  const { currentProjectId, setCurrentProjectId, settings } = useAppStore();
  const [isSidebarOpen, setSidebarOpen] = useState(true); 
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[settings.language || 'zh'];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [view, currentProjectId]);

  return (
    <div className="flex flex-col h-screen bg-background text-gray-300 font-sans overflow-hidden">
      
      <header className="h-16 border-b border-gray-800 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>

          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="hidden md:block text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
             {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer group px-2" onClick={() => setView('create')}>
            <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-all">
                <Video size={18} className="text-primary" />
            </div>
            <span className="font-black text-lg tracking-tighter text-white hidden sm:inline">Director.ai</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Action: New Project - Primary CTA */}
          <button
            onClick={() => { setCurrentProjectId(null); setView('create'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold border ${
              view === 'create' && !currentProjectId 
              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <PlusCircle size={14} />
            <span className="hidden sm:inline">{t.common.newProject}</span>
          </button>
          
          <div className="w-px h-6 bg-gray-800 mx-1 hidden sm:block"></div>

          {/* Utility Nav Group */}
          <div className="flex items-center bg-black/30 border border-gray-800 rounded-xl p-1">
              <button
                onClick={() => setView('settings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${
                  view === 'settings' 
                  ? 'bg-gray-800 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Settings size={14} />
                <span className="hidden sm:inline">{t.common.config}</span>
              </button>

              <button
                onClick={() => setView('about')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${
                  view === 'about' 
                  ? 'bg-gray-800 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
                }`}
                title={t.common.about}
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">{t.common.about}</span>
              </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div 
            className={`hidden md:flex flex-col border-r border-gray-800 bg-surface/50 transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
            }`}
        >
           <HistoryView currentView={view} setView={setView} />
        </div>

        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex justify-start">
                 <div 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
                    onClick={() => setMobileMenuOpen(false)} 
                 />
                 <div className="relative w-4/5 max-w-xs bg-surface h-full shadow-2xl animate-in slide-in-from-left duration-300 border-r border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
                        <span className="font-bold text-white flex items-center gap-2">
                            <Video size={16} className="text-primary"/> {t.nav.projects}
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

        <main className="flex-1 flex flex-col overflow-hidden bg-background relative w-full">
           {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
