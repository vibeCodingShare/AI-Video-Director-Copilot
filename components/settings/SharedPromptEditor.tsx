
import React from 'react';
import { RotateCcw, LucideIcon } from 'lucide-react';

interface SharedPromptEditorProps {
  title: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
  icon: LucideIcon;
  iconColorClass?: string;
  heightClass?: string;
  placeholder?: string;
  badge?: string;
  onReset?: () => void;
  footer?: React.ReactNode;
}

const SharedPromptEditor: React.FC<SharedPromptEditorProps> = ({
  title,
  description,
  value,
  onChange,
  icon: Icon,
  iconColorClass = "text-primary",
  heightClass = "h-48",
  placeholder = "Enter prompt here...",
  badge,
  onReset,
  footer
}) => {
  return (
    <div className="bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 hover:border-gray-700 transition-all flex flex-col group shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Icon size={120} />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 bg-gray-900 rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors ${iconColorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xl">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <code className="text-[10px] bg-black/40 px-2.5 py-1 rounded-lg font-bold border border-gray-800 text-gray-400 group-hover:border-gray-700 transition-colors uppercase tracking-widest">
              {badge}
            </code>
          )}
          {onReset && (
            <button 
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              className="p-2 text-gray-600 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Reset to default"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <textarea 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${heightClass} bg-black/40 border border-gray-700 rounded-xl p-5 text-sm font-mono text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all resize-none leading-relaxed shadow-inner scrollbar-thin`}
          placeholder={placeholder}
          spellCheck={false}
        />
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
};

export default SharedPromptEditor;
