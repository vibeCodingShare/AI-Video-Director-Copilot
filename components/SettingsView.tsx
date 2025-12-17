
import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/AppContext';
import { Settings, Save, RotateCcw, PenTool, Image as ImageIcon, Cpu, Sliders, Palette, ChevronRight, AlertCircle } from 'lucide-react';
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
    alertBox.className = "fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-3.5 rounded-2xl font-black shadow-2xl shadow-primary/30 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 border border-white/10";
    alertBox.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> <span>${t.common.success}</span>`;
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
      <div className="p-4 md:p-8 border-b border-gray-800 bg-surface flex justify-between items-center shrink-0 z-30">
        <div className="flex items-center gap-4">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Settings className="text-gray-400" size={24} />
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {t.settings.title}
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide">Workspace Configuration</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleReset} 
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-white transition-all bg-transparent hover:bg-white/5 rounded-xl border border-transparent hover:border-gray-800 group"
            >
                <RotateCcw size={14} className="group-hover:-rotate-90 transition-transform" /> 
                <span className="hidden sm:inline">{t.common.defaults}</span>
            </button>
            <button 
                onClick={handleSave} 
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl transition-all font-black text-xs shadow-xl shadow-primary/10 active:scale-95 group border border-white/10"
            >
                <Save size={16} className="group-hover:translate-y-[-1px] transition-transform" /> 
                {t.common.save}
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
                    className={`flex items-center justify-center md:justify-between gap-2 px-3 py-2.5 md:px-5 md:py-4 rounded-xl text-xs md:text-sm font-bold transition-all border group ${activeTab === tab.id ? 'bg-white/5 text-white border-white/10 shadow-sm' : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300'}`}
                >
                    <div className="flex items-center gap-3">
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-primary' : 'text-gray-500 group-hover:text-gray-400'} />
                        <span className="hidden md:inline">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && <ChevronRight size={14} className="hidden md:block text-primary/50 animate-in slide-in-from-left-2" />}
                </button>
            ))}
            
            <div className="hidden md:flex mt-auto p-4 bg-primary/5 border border-primary/10 rounded-2xl items-start gap-3">
                 <AlertCircle size={16} className="text-primary/70 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-gray-500 font-bold leading-tight uppercase tracking-wider">
                     {localSettings.language === 'zh' ? '注意：修改后请点击右上角保存以应用更改。' : 'Note: Please click save in the top right to apply changes.'}
                 </p>
            </div>
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
