
import React, { useState, useEffect } from 'react';
import { ProjectInput as IProjectInput } from '../types';
import { useAppStore } from '../store/AppContext';
import { Wand2, Loader2, FileText, User, Clock, MessageSquarePlus, Image as ImageIcon, CheckCircle, BrainCircuit } from 'lucide-react';

interface ProjectInputProps {
  onSuccess?: () => void;
}

const ProjectInput: React.FC<ProjectInputProps> = ({ onSuccess }) => {
  const { settings, startProjectCreation, taskState, resetCreationState } = useAppStore();
  const { creationStatus, isCreating } = taskState;
  
  // Initialize with first available template if exists
  const [input, setInput] = useState<IProjectInput>({
    title: '',
    persona: 'Tech Reviewer',
    rawContent: '',
    additionalPrompt: '',
    targetDuration: 120,
    initialStyleId: settings.imageStyleTemplates[0]?.id || ''
  });

  // Watch for success status to trigger navigation
  useEffect(() => {
    if (creationStatus === 'success') {
        const timer = setTimeout(() => {
            resetCreationState(); // Reset status so we can create another one later
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
            <h2 className="text-2xl font-bold text-white mb-2">Script Generated!</h2>
            <p className="text-gray-400 mb-6">The Director has finished the initial draft. Loading studio...</p>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[width_1.5s_ease-in-out_forwards] w-0"></div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
          Start New Project
        </h1>
        <p className="text-gray-400">
          Transform your rough notes into a production-ready shooting script.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-gray-800 rounded-2xl p-8 shadow-xl space-y-6 relative transition-opacity duration-300">
        
        {/* Loading Overlay (Global State) */}
        {isCreating && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 rounded-2xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full"></div>
                    <Loader2 size={48} className="animate-spin text-primary relative z-10" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">
                    {creationStatus === 'analyzing' ? 'Analyzing Intent...' : 'Writing Script...'}
                </h3>
                
                <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
                    {creationStatus === 'analyzing' && (
                        <span className="flex items-center gap-2 animate-pulse text-amber-400">
                            <BrainCircuit size={14} /> Optimizing your raw ideas
                        </span>
                    )}
                    {creationStatus === 'scripting' && (
                        <span className="flex items-center gap-2 animate-pulse text-blue-400">
                            <Wand2 size={14} /> The Director is drafting scenes
                        </span>
                    )}
                </div>
            </div>
        )}

        {/* Title */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <FileText size={16} /> Project Title
          </label>
          <input 
            type="text" 
            required
            className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="e.g., iPhone 16 Review"
            value={input.title}
            onChange={e => setInput({...input, title: e.target.value})}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Persona */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <User size={16} /> Persona / Style
            </label>
            <input 
              type="text" 
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="e.g., Energetic Vlogger, Calm Educator"
              value={input.persona}
              onChange={e => setInput({...input, persona: e.target.value})}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Clock size={16} /> Target Duration (seconds)
            </label>
            <input 
              type="number" 
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              value={input.targetDuration}
              onChange={e => setInput({...input, targetDuration: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>
        
        {/* Style Selection */}
        <div>
           <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <ImageIcon size={16} /> Visual Style Template
           </label>
           <div className="relative">
             <select 
               value={input.initialStyleId}
               onChange={e => setInput({...input, initialStyleId: e.target.value})}
               className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
             >
                <option value="">No Default Style</option>
                {settings.imageStyleTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
           </div>
           <p className="text-xs text-gray-500 mt-1">This style will be applied to all storyboard images generated for this project.</p>
        </div>

        {/* Raw Content */}
        <div>
           <div className="flex justify-between items-center mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <MessageSquarePlus size={16} /> Raw Content / Ideas
                </label>
                {settings.enableIntentAnalysis && (
                    <span className="text-[10px] bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/50 flex items-center gap-1">
                        <BrainCircuit size={10} /> Auto-Optimization Enabled
                    </span>
                )}
           </div>
          <textarea 
            required
            className="w-full h-48 bg-black/50 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm leading-relaxed"
            placeholder="Paste your notes, blog post, or rough thoughts here..."
            value={input.rawContent}
            onChange={e => setInput({...input, rawContent: e.target.value})}
          />
        </div>

        {/* Additional Instructions */}
        <div>
           <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              Additional Instructions (Optional)
            </label>
          <input 
            type="text" 
            className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="e.g., Use lots of B-Roll, keep it fast paced, include a CTA at the end."
            value={input.additionalPrompt}
            onChange={e => setInput({...input, additionalPrompt: e.target.value})}
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.99]"
          >
            <Wand2 size={20} />
            Generate Director's Script
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectInput;
