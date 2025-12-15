
import React, { useRef } from 'react';
import { useAppStore } from '../store/AppContext';
import { Upload, Download, Trash2, ChevronRight } from 'lucide-react';

interface HistoryViewProps {
  currentView: string;
  setView: (view: 'create' | 'script' | 'edit' | 'settings') => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ currentView, setView }) => {
  const { projects, currentProjectId, setCurrentProjectId, deleteProject, importProjects } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `director_ai_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importProjects(json);
      } catch (err) {
        alert("Failed to parse the backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleProjectSelect = (id: string) => {
    setCurrentProjectId(id);
    setView('script');
  };

  return (
    <aside className="w-72 bg-surface/50 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">History</h3>
        <div className="flex gap-2">
            <button 
              onClick={handleImportClick} 
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors" 
              title="Import Backup"
            >
                <Upload size={14} />
            </button>
            <button 
              onClick={handleExport} 
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors" 
              title="Export Backup"
            >
                <Download size={14} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="application/json" 
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-sm italic px-4">
                No history found.<br/>Start a new project!
            </div>
        )}
        {projects.map(p => {
          const isActive = currentProjectId === p.id && currentView !== 'create' && currentView !== 'settings';
          return (
            <div 
              key={p.id} 
              className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all border border-transparent ${
                isActive 
                ? 'bg-black/40 border-gray-700 text-white shadow-sm' 
                : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => handleProjectSelect(p.id)}
            >
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{p.title}</span>
                <span className="text-[10px] text-gray-600 truncate mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              
              {isActive ? (
                <ChevronRight size={14} className="text-primary shrink-0" />
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('Delete project?')) deleteProject(p.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 hover:bg-red-400/10 rounded transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default HistoryView;
