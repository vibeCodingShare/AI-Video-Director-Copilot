
import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/AppContext';
import { Settings, Save, RotateCcw, PenTool, Image as ImageIcon, Cpu, Sliders, Palette, ChevronRight } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants';
import { translations } from '../translations';

// Sub-components
import BasicSettings from './settings/BasicSettings';
import ModelSettings from './settings/ModelSettings';
import PromptSettings from './settings/PromptSettings';
import StyleSettings from './settings/StyleSettings';

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const t = translations[localSettings.language || 'zh'];

  const [activeTab, setActiveTab] = useState<'basic' | 'llm' | 'prompts' | 'styles'>('basic');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    updateSettings(localSettings);
    // Simple notification
    const alertBox = document.createElement('div');
    alertBox.className = "fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300";
    alertBox.innerText = t.common.success;
    document.body.appendChild(alertBox);
    setTimeout(() => {
        alertBox.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => alertBox.remove(), 300);
    }, 2000);
  };

  const handleReset = () => {
    if(confirm(t.common.defaults + "?")) {
        setLocalSettings(DEFAULT_SETTINGS);
        updateSettings(DEFAULT_SETTINGS); 
    }
  };

  const handleTabChange = (tabId: 'basic' | 'llm' | 'prompts' | 'styles') => {
      setActiveTab(tabId);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const tabs = [
      { id: 'basic', label: t.settings.general, icon: Sliders },
      { id: 'llm', label: t.settings.models, icon: Cpu },
      { id: 'prompts', label: t.settings.prompts, icon: PenTool },
      { id: 'styles', label: t.settings.styles, icon: Palette },
  ];

  return (
    <div className="h-full flex flex-col bg-background text-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 border-b border-gray-800/50 bg-surface/30 backdrop-blur-md flex justify-between items-center shrink-0 z-30">
        <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/30">
                <Settings className="text-primary" size={24} />
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {t.settings.title}
                </h1>
                <p className="text-xs text-gray-500 font-medium">Configure your production workspace and AI logic.</p>
            </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleReset} 
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-all bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-gray-700/50"
            >
                <RotateCcw size={14} /> <span className="hidden sm:inline">{t.common.defaults}</span>
            </button>
            <button 
                onClick={handleSave} 
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl transition-all font-black text-sm shadow-lg shadow-primary/20 active:scale-95"
            >
                <Save size={18} /> {t.common.save}
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-surface md:border-r border-b md:border-b-0 border-gray-800/80 p-2 md:p-6 grid grid-cols-4 md:flex md:flex-col shrink-0 gap-2 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => handleTabChange(tab.id as any)} 
                    className={`flex items-center justify-center md:justify-between gap-2 px-3 py-2.5 md:px-5 md:py-4 rounded-xl text-xs md:text-sm font-bold transition-all border group ${activeTab === tab.id ? 'bg-primary/10 text-white border-primary/50 shadow-xl shadow-primary/5' : 'text-gray-500 border-transparent hover:bg-gray-800 hover:text-gray-300'}`}
                >
                    <div className="flex items-center gap-3">
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-primary' : 'text-gray-500 group-hover:text-gray-400'} />
                        <span className="hidden md:inline">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && <ChevronRight size={14} className="hidden md:block text-primary animate-in slide-in-from-left-2" />}
                </button>
            ))}
        </div>

        {/* Scrollable Content Container */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative no-scrollbar">
            <div className="min-h-full">
                {activeTab === 'basic' && <BasicSettings localSettings={localSettings} setLocalSettings={setLocalSettings} t={t} />}
                {activeTab === 'llm' && <ModelSettings localSettings={localSettings} setLocalSettings={setLocalSettings} t={t} />}
                {activeTab === 'prompts' && <PromptSettings localSettings={localSettings} setLocalSettings={setLocalSettings} t={t} />}
                {activeTab === 'styles' && <StyleSettings localSettings={localSettings} setLocalSettings={setLocalSettings} t={t} />}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
