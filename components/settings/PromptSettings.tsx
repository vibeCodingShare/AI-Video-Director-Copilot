
import React, { useState } from 'react';
import { 
  FileJson, Layers, Workflow, User, Video, Link, Cpu, Scissors, 
  Wand2, Shield, HelpCircle, AlertCircle 
} from 'lucide-react';
import { AppSettings } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants';
import SharedPromptEditor from './SharedPromptEditor';

interface PromptSettingsProps {
    localSettings: AppSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    t: any;
}

const VariableBadge: React.FC<{ name: string; desc: string }> = ({ name, desc }) => (
    <div className="flex flex-col gap-1 p-4 bg-black/40 border border-gray-800 rounded-xl group hover:border-primary/50 transition-all">
        <code className="text-primary text-xs font-bold font-mono group-hover:scale-105 transition-transform">{`{{${name}}}`}</code>
        <span className="text-[10px] text-gray-500 leading-tight">{desc}</span>
    </div>
);

const PromptSettings: React.FC<PromptSettingsProps> = ({ localSettings, setLocalSettings, t }) => {
    const [promptSubTab, setPromptSubTab] = useState<'template' | 'variables' | 'workflow'>('template');

    const availableVariables = [
        { name: 'STORYBOARD', desc: 'Rules for A-Roll/B-Roll categorization.' },
        { name: 'CINEMATOGRAPHY', desc: 'Styles for shot sizes, moves, and lighting.' },
        { name: 'DIRECTOR', desc: 'Tone, emotion, and character persona rules.' },
        { name: 'CONTINUITY', desc: 'Consistency and logic between scenes.' },
    ];

    return (
        <div className="flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
            
            {/* Inner Tabs for Prompts */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-md z-20 px-4 md:px-8 pt-4 md:pt-6 pb-2 border-b border-gray-800 flex items-center gap-6 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setPromptSubTab('template')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center whitespace-nowrap px-1 ${promptSubTab === 'template' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <FileJson size={14} className="mr-2" />
                    {t.settings.promptTabs.main}
                </button>
                <button
                    onClick={() => setPromptSubTab('variables')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center whitespace-nowrap px-1 ${promptSubTab === 'variables' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <Layers size={14} className="mr-2" />
                    {t.settings.promptTabs.variables}
                </button>
                <button
                    onClick={() => setPromptSubTab('workflow')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center whitespace-nowrap px-1 ${promptSubTab === 'workflow' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <Workflow size={14} className="mr-2" />
                    {t.settings.promptTabs.workflow}
                </button>
            </div>

            {/* Content Area */}
            <div className="px-4 md:px-8 py-8">
                
                {/* SUB-TAB 1: TEMPLATE EDITOR */}
                {promptSubTab === 'template' && (
                    <div className="space-y-8 max-w-5xl">
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.director}
                            description={t.settings.promptLabels.directorDesc}
                            value={localSettings.directorMainPrompt}
                            onChange={(val) => setLocalSettings({...localSettings, directorMainPrompt: val})}
                            icon={Wand2}
                            heightClass="h-[500px]"
                            badge="System Prompt"
                            onReset={() => setLocalSettings(prev => ({...prev, directorMainPrompt: DEFAULT_SETTINGS.directorMainPrompt}))}
                            footer={
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <HelpCircle size={14} /> Available Injection Variables
                                    </h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {availableVariables.map((v) => (
                                            <VariableBadge key={v.name} name={v.name} desc={v.desc} />
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center gap-3 text-[11px] text-gray-500 italic">
                                        <AlertCircle size={14} className="text-primary" />
                                        <span>Use {`{{VARIABLE_NAME}}`} to inject values from the Variables tab.</span>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                )}

                {/* SUB-TAB 2: VARIABLES FORM (Single Column) */}
                {promptSubTab === 'variables' && (
                    <div className="max-w-4xl space-y-6">
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.varPersona}
                            description={t.settings.promptLabels.varPersonaDesc}
                            value={localSettings.directorVar_director}
                            onChange={(val) => setLocalSettings({...localSettings, directorVar_director: val})}
                            icon={User}
                            iconColorClass="text-emerald-400"
                            badge="{{DIRECTOR}}"
                        />
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.varCine}
                            description={t.settings.promptLabels.varCineDesc}
                            value={localSettings.directorVar_cinematography}
                            onChange={(val) => setLocalSettings({...localSettings, directorVar_cinematography: val})}
                            icon={Video}
                            iconColorClass="text-purple-400"
                            badge="{{CINEMATOGRAPHY}}"
                        />
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.varStoryboard}
                            description={t.settings.promptLabels.varStoryboardDesc}
                            value={localSettings.directorVar_storyboard}
                            onChange={(val) => setLocalSettings({...localSettings, directorVar_storyboard: val})}
                            icon={Layers}
                            iconColorClass="text-blue-400"
                            badge="{{STORYBOARD}}"
                        />
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.varCont}
                            description={t.settings.promptLabels.varContDesc}
                            value={localSettings.directorVar_continuity}
                            onChange={(val) => setLocalSettings({...localSettings, directorVar_continuity: val})}
                            icon={Link}
                            iconColorClass="text-amber-400"
                            badge="{{CONTINUITY}}"
                        />
                    </div>
                )}

                {/* SUB-TAB 3: WORKFLOW PROMPTS */}
                {promptSubTab === 'workflow' && (
                    <div className="max-w-4xl space-y-6">
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.intent}
                            description={t.settings.promptLabels.intentDesc}
                            value={localSettings.intentPrompt}
                            onChange={(val) => setLocalSettings({...localSettings, intentPrompt: val})}
                            icon={Cpu}
                            iconColorClass="text-amber-400"
                            onReset={() => setLocalSettings(prev => ({...prev, intentPrompt: DEFAULT_SETTINGS.intentPrompt}))}
                        />
                        <SharedPromptEditor 
                            title={t.settings.promptLabels.editor}
                            description={t.settings.promptLabels.editorDesc}
                            value={localSettings.editingPrompt}
                            onChange={(val) => setLocalSettings({...localSettings, editingPrompt: val})}
                            icon={Scissors}
                            iconColorClass="text-primary"
                            onReset={() => setLocalSettings(prev => ({...prev, editingPrompt: DEFAULT_SETTINGS.editingPrompt}))}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptSettings;
