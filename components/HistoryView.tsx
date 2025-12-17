
import React, { useRef, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { Upload, Download, Trash2, ChevronRight, Cpu, Image as ImageIcon, Key, ArrowRight } from 'lucide-react';
import { translations } from '../translations';

interface HistoryViewProps {
  currentView: string;
  setView: (view: 'create' | 'script' | 'edit' | 'settings' | 'about') => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ currentView, setView }) => {
  const { projects, currentProjectId, setCurrentProjectId, deleteProject, importProjects, settings } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[settings.language || 'zh'];

  const isConfigured = useMemo(() => {
    const activeTextModel = settings.textModels.find(m => m.id === settings.activeTextModelId);
    const activeImageModel = settings.imageModels.find(m => m.id === settings.activeImageModelId);
    const textOk = !!activeTextModel?.apiKey || (!!activeTextModel?.accessKey && !!activeTextModel?.secretKey);
    const imageOk = !!activeImageModel?.apiKey || (!!activeImageModel?.accessKey && !!activeImageModel?.secretKey);
    return textOk && imageOk;
  }, [settings]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `director_ai_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importProjects(json);
      } catch (err) { alert("Import Failed"); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.common.history}</h3>
        <div className="flex gap-2">
            <button onClick={handleImportClick} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors" title={t.common.import}>
                <Upload size={14} />
            </button>
            <button onClick={handleExport} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors" title={t.common.export}>
                <Download size={14} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 ? (
            <div className="p-4 space-y-6">
                {!isConfigured && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2"><Key size={12} /> {t.onboarding.title}</h4>
                      <div className="space-y-4">
                          <div className="flex gap-3">
                              <div className="bg-gray-800 p-2 rounded-lg shrink-0 h-fit"><Cpu size={14} className="text-blue-400" /></div>
                              <div>
                                  <p className="text-xs text-white font-medium mb-1">{t.onboarding.llmTitle}</p>
                                  <p className="text-[10px] text-gray-500 leading-relaxed">{t.onboarding.llmDesc}</p>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <div className="bg-gray-800 p-2 rounded-lg shrink-0 h-fit"><ImageIcon size={14} className="text-pink-400" /></div>
                              <div>
                                  <p className="text-xs text-white font-medium mb-1">{t.onboarding.imgTitle}</p>
                                  <p className="text-[10px] text-gray-500 leading-relaxed">{t.onboarding.imgDesc}</p>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setView('settings')} className="w-full mt-4 bg-primary text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                          {t.onboarding.action} <ArrowRight size={12}/>
                      </button>
                  </div>
                )}
                <div className="text-center py-4 text-gray-600 text-[11px] italic">
                    {isConfigured ? t.onboarding.noProjects : t.onboarding.importHint}
                </div>
            </div>
        ) : (
            projects.map(p => {
              const isActive = currentProjectId === p.id && currentView !== 'create' && currentView !== 'settings' && currentView !== 'about';
              return (
                <div key={p.id} className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all border border-transparent ${isActive ? 'bg-black/40 border-gray-700 text-white shadow-sm' : 'hover:bg-gray-800/50 text-gray-400'}`} onClick={() => { setCurrentProjectId(p.id); setView('script'); }}>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">{p.title}</span>
                    <span className="text-[10px] text-gray-600 truncate mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  {isActive ? <ChevronRight size={14} className="text-primary shrink-0" /> : <button onClick={(e) => { e.stopPropagation(); if(confirm(t.common.delete + "?")) deleteProject(p.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 hover:bg-red-400/10 rounded transition-all shrink-0"><Trash2 size={12} /></button>}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default HistoryView;
