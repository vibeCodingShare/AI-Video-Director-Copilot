
import React, { useState, useEffect } from 'react';
import { ProjectInput as IProjectInput } from '../types';
import { useAppStore } from '../store/AppContext';
import { Wand2, Loader2, FileText, User, Clock, MessageSquarePlus, Image as ImageIcon, CheckCircle, BrainCircuit } from 'lucide-react';
import { translations } from '../translations';

interface ProjectInputProps {
  onSuccess?: () => void;
}

const ProjectInput: React.FC<ProjectInputProps> = ({ onSuccess }) => {
  const { settings, startProjectCreation, taskState, resetCreationState } = useAppStore();
  const { creationStatus, isCreating } = taskState;
  const t = translations[settings.language || 'zh'];
  
  const [input, setInput] = useState<IProjectInput>({
    title: '',
    persona: 'Tech Reviewer',
    rawContent: '',
    additionalPrompt: '',
    targetDuration: 120,
    initialStyleId: settings.imageStyleTemplates[0]?.id || ''
  });

  useEffect(() => {
    if (creationStatus === 'success') {
        const timer = setTimeout(() => {
            resetCreationState(); 
            if (onSuccess) onSuccess();
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [creationStatus, onSuccess, resetCreationState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.rawContent) return;
    startProjectCreation(input);
  };

  if (creationStatus === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="bg-surface border border-primary/30 p-10 rounded-2xl flex flex-col items-center shadow-2xl shadow-primary/20 max-w-md text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <CheckCircle size={64} className="text-primary relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.create.successTitle}</h2>
            <p className="text-gray-400 mb-6">{t.create.successDesc}</p>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[width_1.5s_ease-in-out_forwards] w-0"></div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            {t.create.title}
          </h1>
          <p className="text-gray-400">
            {t.create.desc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-gray-800 rounded-2xl p-8 shadow-xl space-y-6 relative transition-opacity duration-300">
          {isCreating && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 rounded-2xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                  <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full"></div>
                      <Loader2 size={48} className="animate-spin text-primary relative z-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                      {creationStatus === 'analyzing' ? t.create.statusAnalyzing : t.create.statusScripting}
                  </h3>
              </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <FileText size={16} /> {t.create.projTitle}
            </label>
            <input 
              type="text" required
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
              placeholder={t.create.projTitleHint}
              value={input.title}
              onChange={e => setInput({...input, title: e.target.value})}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User size={16} /> {t.create.persona}
              </label>
              <input 
                type="text"
                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder={t.create.personaHint}
                value={input.persona}
                onChange={e => setInput({...input, persona: e.target.value})}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Clock size={16} /> {t.create.duration}
              </label>
              <input 
                type="number"
                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
                value={input.targetDuration}
                onChange={e => setInput({...input, targetDuration: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          
          <div>
             <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <ImageIcon size={16} /> {t.create.visualStyle}
             </label>
             <select 
               value={input.initialStyleId}
               onChange={e => setInput({...input, initialStyleId: e.target.value})}
               className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
             >
                <option value="">{t.create.styleHint}</option>
                {settings.imageStyleTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <MessageSquarePlus size={16} /> {t.create.rawContent}
                  </label>
                  {settings.enableIntentAnalysis && (
                      <span className="text-[10px] bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/50 flex items-center gap-1">
                          <BrainCircuit size={10} /> {t.create.intentEnabled}
                      </span>
                  )}
             </div>
            <textarea required
              className="w-full h-48 bg-black/50 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
              placeholder={t.create.rawHint}
              value={input.rawContent}
              onChange={e => setInput({...input, rawContent: e.target.value})}
            />
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                {t.create.additional}
              </label>
            <input type="text"
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
              placeholder={t.create.additionalHint}
              value={input.additionalPrompt}
              onChange={e => setInput({...input, additionalPrompt: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isCreating}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <Wand2 size={20} />
              {t.create.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectInput;
