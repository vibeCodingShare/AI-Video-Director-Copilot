
import React from 'react';
import { Globe, BrainCircuit, Image as ImageIcon } from 'lucide-react';
import { AppSettings } from '../../types';

interface BasicSettingsProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  t: any;
}

const BasicSettings: React.FC<BasicSettingsProps> = ({ localSettings, setLocalSettings, t }) => {
  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        {t.settings.general}
      </h2>
      
      <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800 shadow-xl">
        {/* Language Selection */}
        <div className="p-6 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-800 rounded-lg text-blue-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
              <Globe size={20} />
            </div>
            <div>
              <div className="font-bold text-white">{t.settings.lang}</div>
              <div className="text-xs text-gray-500 mt-0.5">Select your preferred application UI language.</div>
            </div>
          </div>
          <div className="relative">
            <select 
              className="bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer min-w-[140px]"
              value={localSettings.language}
              onChange={e => setLocalSettings(prev => ({ ...prev, language: e.target.value as any }))}
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        
        {/* Intent Analysis Toggle */}
        <div className="p-6 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-800 rounded-lg text-amber-400 group-hover:bg-amber-400/20 transition-colors">
              <BrainCircuit size={20} />
            </div>
            <div className="pr-4">
              <div className="font-bold text-white">{t.settings.intentAnalysis}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.settings.intentAnalysisDesc}</div>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(prev => ({...prev, enableIntentAnalysis: !prev.enableIntentAnalysis}))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${localSettings.enableIntentAnalysis ? 'bg-primary' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.enableIntentAnalysis ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Auto Image Generation Toggle */}
        <div className="p-6 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-800 rounded-lg text-pink-400 group-hover:bg-pink-400/20 transition-colors">
              <ImageIcon size={20} />
            </div>
            <div className="pr-4">
              <div className="font-bold text-white">{t.settings.autoImg}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.settings.autoImgDesc}</div>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(prev => ({...prev, autoGenerateImageOnScript: !prev.autoGenerateImageOnScript}))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${localSettings.autoGenerateImageOnScript ? 'bg-primary' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.autoGenerateImageOnScript ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicSettings;
