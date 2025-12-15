
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Settings, Save, RotateCcw, PenTool, Clapperboard, Scissors, Image as ImageIcon, Plus, Trash2, Cpu, Sliders, FileJson, Layers, User, Palette, CheckCircle, Key, ExternalLink } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants';
import { ImageStyleTemplate, ModelConfig, ModelProvider } from '../types';

// --- Extracted Component to prevent re-render focus loss ---

interface ModelConfigRowProps {
    config: ModelConfig;
    type: 'text' | 'image';
    isActive: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onUpdate: (updates: Partial<ModelConfig>) => void;
    onSetActive: () => void;
}

const ModelConfigRow: React.FC<ModelConfigRowProps> = ({ 
    config, 
    type, 
    isActive, 
    isEditing, 
    onEdit, 
    onDelete, 
    onUpdate, 
    onSetActive 
}) => {
    return (
      <div className={`bg-surface border ${isActive ? 'border-primary/50 bg-primary/5' : 'border-gray-800'} rounded-lg p-4 transition-all`}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                 <button 
                    onClick={onSetActive}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'border-primary bg-primary' : 'border-gray-500 hover:border-white'}`}
                    title="Set Active"
                 >
                     {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                 </button>
                 <span className="font-bold text-white text-sm">{config.name}</span>
                 <span className="text-[10px] uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{config.provider}</span>
            </div>
            <div className="flex gap-2">
                <button onClick={onEdit} className="text-xs text-blue-400 hover:text-blue-300 underline">
                    {isEditing ? 'Done' : 'Edit'}
                </button>
                {!isActive && (
                    <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 p-1 rounded">
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
        </div>

        {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-1">
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Display Name</label>
                    <input 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm text-white"
                        value={config.name}
                        onChange={e => onUpdate({ name: e.target.value })}
                    />
                </div>
                <div>
                     <label className="text-xs text-gray-500 block mb-1">Provider Type</label>
                     <select 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm text-white"
                        value={config.provider}
                        onChange={e => onUpdate({ provider: e.target.value as ModelProvider })}
                     >
                         <option value="google">Google GenAI</option>
                         <option value="openai-compatible">OpenAI Compatible (ChatGPT, DeepSeek)</option>
                         <option value="jimeng">Volcengine Jimeng 4 (Ark/Doubao)</option>
                         <option value="kling">Kling AI (可灵)</option>
                     </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Model ID (e.g. kling-v1, gpt-4...)</label>
                    <input 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm text-white"
                        placeholder="Model ID"
                        value={config.modelId}
                        onChange={e => onUpdate({ modelId: e.target.value })}
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                     <label className="text-xs text-gray-500 block mb-1">API Key / Bearer Token</label>
                     <div className="relative">
                        <Key size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                        <input 
                            className="w-full bg-black/40 border border-gray-700 rounded p-2 pl-8 text-sm text-white font-mono"
                            type="password"
                            placeholder="sk-..."
                            value={config.apiKey}
                            onChange={e => onUpdate({ apiKey: e.target.value })}
                        />
                     </div>
                </div>
                {(config.provider === 'openai-compatible' || config.provider === 'jimeng' || config.provider === 'kling') && (
                     <div className="col-span-1 md:col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">Base URL</label>
                        <input 
                            className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm text-gray-300 font-mono"
                            placeholder="https://..."
                            value={config.baseUrl || ''}
                            onChange={e => onUpdate({ baseUrl: e.target.value })}
                        />
                         <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-2">
                             {config.provider === 'jimeng' && (
                                <span className="text-primary flex items-center gap-1">
                                    Recommended: https://ark.cn-beijing.volces.com/api/v3 
                                    <a href="https://www.volcengine.com/docs/85621/1820192?lang=zh" target="_blank" rel="noreferrer" className="underline flex items-center"><ExternalLink size={10} /> Docs</a>
                                </span>
                             )}
                             {config.provider === 'kling' && (
                                <span className="text-primary flex items-center gap-1">
                                    Recommended: https://api.klingai.com/v1
                                    <a href="https://app.klingai.com/cn/dev/document-api/apiReference/model/imageGeneration" target="_blank" rel="noreferrer" className="underline flex items-center"><ExternalLink size={10} /> Docs</a>
                                </span>
                             )}
                         </div>
                    </div>
                )}
            </div>
        )}
      </div>
    );
};

// --- Main Component ---

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<'basic' | 'llm' | 'prompts' | 'styles'>('basic');
  const [promptSubTab, setPromptSubTab] = useState<'template' | 'variables'>('template');
  
  // State for editing a specific model config
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const handleSave = () => {
    updateSettings(localSettings);
    alert('Settings saved successfully');
  };

  const handleReset = () => {
    if(confirm("Reset all settings and prompts to default?")) {
        setLocalSettings(DEFAULT_SETTINGS);
        updateSettings(DEFAULT_SETTINGS); // Also update global store immediately to be safe
    }
  };

  const addImageTemplate = () => {
    const newTemplate: ImageStyleTemplate = {
        id: crypto.randomUUID(),
        name: 'New Style',
        prompt: 'A shot of {{DESCRIPTION}}...'
    };
    setLocalSettings({
        ...localSettings,
        imageStyleTemplates: [...localSettings.imageStyleTemplates, newTemplate]
    });
  };

  const updateImageTemplate = (id: string, field: 'name' | 'prompt', value: string) => {
    setLocalSettings(prev => ({
        ...prev,
        imageStyleTemplates: prev.imageStyleTemplates.map(t => 
            t.id === id ? { ...t, [field]: value } : t
        )
    }));
  };

  const removeImageTemplate = (id: string) => {
      setLocalSettings(prev => ({
          ...prev,
          imageStyleTemplates: prev.imageStyleTemplates.filter(t => t.id !== id)
      }));
  };

  // --- MODEL CONFIG LOGIC ---

  const addModelConfig = (type: 'text' | 'image') => {
    const newConfig: ModelConfig = {
      id: crypto.randomUUID(),
      name: type === 'text' ? 'New LLM' : 'New Image Model',
      provider: 'openai-compatible',
      apiKey: '',
      baseUrl: '',
      modelId: ''
    };
    if (type === 'text') {
      setLocalSettings(prev => ({ ...prev, textModels: [...prev.textModels, newConfig] }));
    } else {
      setLocalSettings(prev => ({ ...prev, imageModels: [...prev.imageModels, newConfig] }));
    }
    setEditingModelId(newConfig.id);
  };

  const updateModelConfig = (type: 'text' | 'image', id: string, updates: Partial<ModelConfig>) => {
    const listKey = type === 'text' ? 'textModels' : 'imageModels';
    setLocalSettings(prev => {
      const updatedModels = prev[listKey].map(m => {
        if (m.id !== id) return m;
        
        const updatedModel = { ...m, ...updates };
        
        // Auto-fill defaults
        if (updates.provider === 'jimeng' && m.provider !== 'jimeng') {
            updatedModel.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
            if (!updatedModel.name.includes('Jimeng')) updatedModel.name = 'Jimeng 4 (Volcengine)';
        }
        if (updates.provider === 'kling' && m.provider !== 'kling') {
            updatedModel.baseUrl = 'https://api.klingai.com/v1';
            updatedModel.modelId = 'kling-v1';
            if (!updatedModel.name.includes('Kling')) updatedModel.name = 'Kling AI (可灵)';
        }
        
        return updatedModel;
      });

      return {
        ...prev,
        [listKey]: updatedModels
      };
    });
  };

  const deleteModelConfig = (type: 'text' | 'image', id: string) => {
    if(!confirm("Remove this model configuration?")) return;
    const listKey = type === 'text' ? 'textModels' : 'imageModels';
    setLocalSettings(prev => {
        const newState = {
            ...prev,
            [listKey]: prev[listKey].filter(m => m.id !== id)
        };
        // Handle active ID reset if needed
        if (type === 'text' && prev.activeTextModelId === id) {
            newState.activeTextModelId = newState.textModels[0]?.id || '';
        }
        if (type === 'image' && prev.activeImageModelId === id) {
            newState.activeImageModelId = newState.imageModels[0]?.id || '';
        }
        return newState;
    });
  };

  const tabs = [
      { id: 'basic', label: '1. Basic Settings', icon: Sliders },
      { id: 'llm', label: '2. LLM / BYOK', icon: Cpu },
      { id: 'prompts', label: '3. Prompt Configuration', icon: PenTool },
      { id: 'styles', label: '4. Visual Styles', icon: Palette },
  ];

  const availableVariables = [
      { name: '{{DIRECTOR}}', desc: 'Emotion, Tone, Performance' },
      { name: '{{CINEMATOGRAPHY}}', desc: 'Camera, Lighting, Art' },
      { name: '{{STORYBOARD}}', desc: 'Scene Types, Visual Content' },
      { name: '{{CONTINUITY}}', desc: 'Flow, Logic, Details' },
  ];

  return (
    <div className="h-full flex flex-col bg-background text-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-primary" /> Configuration Center
        </h1>
        <div className="flex gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors">
                <RotateCcw size={14} /> Defaults
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm">
                <Save size={16} /> Save Changes
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-surface border-r border-gray-800 p-4 flex flex-col gap-2 overflow-y-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id 
                        ? 'bg-primary/20 text-white border border-primary/50' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
            
            {/* TAB 1: BASIC SETTINGS */}
            {activeTab === 'basic' && (
                <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-white">General Preferences</h2>
                        <div className="bg-surface border border-gray-800 rounded-lg divide-y divide-gray-800">
                            
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-white">Enable Intent Analysis (Prompt Optimizer)</div>
                                    <div className="text-sm text-gray-500">Refines your raw input using AI before generating the script.</div>
                                </div>
                                <button 
                                    onClick={() => setLocalSettings(prev => ({...prev, enableIntentAnalysis: !prev.enableIntentAnalysis}))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.enableIntentAnalysis ? 'bg-primary' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.enableIntentAnalysis ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="p-4 flex items-center justify-between opacity-50 cursor-not-allowed" title="Coming Soon">
                                <div>
                                    <div className="font-medium text-white">Auto-generate Images (Coming Soon)</div>
                                    <div className="text-sm text-gray-500">Automatically generate storyboards when script is created.</div>
                                </div>
                                <div className="h-6 w-11 bg-gray-800 rounded-full border border-gray-600"></div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: LLM SETTINGS (BYOK) */}
            {activeTab === 'llm' && (
                <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg text-sm text-blue-200 mb-6">
                        <h3 className="font-bold flex items-center gap-2 mb-1"><CheckCircle size={16} /> Bring Your Own Key (BYOK)</h3>
                        <p>Configure multiple AI providers here. The selected "Active" model will be used for all operations. Supports Google Gemini, Jimeng 4, Kling AI, and any OpenAI-compatible API.</p>
                    </div>

                    {/* Text Models */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Script & Logic Models</h2>
                                <p className="text-xs text-gray-500 mt-1">Used for intent analysis, script writing, and editing plans.</p>
                            </div>
                            <button onClick={() => addModelConfig('text')} className="text-xs flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors text-white">
                                <Plus size={14} /> Add Model
                            </button>
                        </div>
                        <div className="space-y-4">
                            {localSettings.textModels.map(m => (
                                <ModelConfigRow 
                                    key={m.id} 
                                    config={m} 
                                    type="text" 
                                    isActive={localSettings.activeTextModelId === m.id}
                                    isEditing={editingModelId === m.id}
                                    onEdit={() => setEditingModelId(editingModelId === m.id ? null : m.id)}
                                    onDelete={() => deleteModelConfig('text', m.id)}
                                    onUpdate={(updates) => updateModelConfig('text', m.id, updates)}
                                    onSetActive={() => setLocalSettings(prev => ({...prev, activeTextModelId: m.id}))}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-800 my-8"></div>

                    {/* Image Models */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Storyboard Image Models</h2>
                                <p className="text-xs text-gray-500 mt-1">Used for generating scene reference images.</p>
                            </div>
                            <button onClick={() => addModelConfig('image')} className="text-xs flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors text-white">
                                <Plus size={14} /> Add Model
                            </button>
                        </div>
                         <div className="space-y-4">
                            {localSettings.imageModels.map(m => (
                                <ModelConfigRow 
                                    key={m.id} 
                                    config={m} 
                                    type="image" 
                                    isActive={localSettings.activeImageModelId === m.id}
                                    isEditing={editingModelId === m.id}
                                    onEdit={() => setEditingModelId(editingModelId === m.id ? null : m.id)}
                                    onDelete={() => deleteModelConfig('image', m.id)}
                                    onUpdate={(updates) => updateModelConfig('image', m.id, updates)}
                                    onSetActive={() => setLocalSettings(prev => ({...prev, activeImageModelId: m.id}))}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: PROMPT SETTINGS */}
            {activeTab === 'prompts' && (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
                    
                    {/* Inner Tabs for Prompts */}
                    <div className="flex items-center gap-6 border-b border-gray-800 mb-6">
                        <button
                            onClick={() => setPromptSubTab('template')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${promptSubTab === 'template' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            System Instruction Template
                        </button>
                        <button
                            onClick={() => setPromptSubTab('variables')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${promptSubTab === 'variables' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Variables Setup
                        </button>
                    </div>

                    {/* SUB-TAB 1: TEMPLATE EDITOR */}
                    {promptSubTab === 'template' && (
                        <div className="space-y-6 max-w-4xl">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileJson size={18} className="text-primary" /> Main Director Template
                                    </h3>
                                    <button onClick={() => setLocalSettings(prev => ({...prev, directorMainPrompt: DEFAULT_SETTINGS.directorMainPrompt}))} className="text-xs text-gray-500 hover:text-white">Reset Default</button>
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={localSettings.directorMainPrompt}
                                        onChange={(e) => setLocalSettings(prev => ({...prev, directorMainPrompt: e.target.value}))}
                                        className="w-full h-80 bg-black/50 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 focus:border-primary outline-none leading-relaxed"
                                        placeholder="Enter system prompt here..."
                                    />
                                </div>
                            </div>

                            <div className="bg-surface border border-gray-800 rounded-lg p-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Available Variables</h4>
                                <div className="flex flex-wrap gap-2">
                                    {availableVariables.map((v) => (
                                        <div key={v.name} className="flex items-center bg-gray-800 rounded border border-gray-700 px-3 py-1.5" title={v.desc}>
                                            <span className="text-primary font-mono text-xs font-bold mr-2">{v.name}</span>
                                            <span className="text-gray-400 text-xs">{v.desc}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    Use these variables in the template above. They will be replaced by the content defined in the "Variables Setup" tab during script generation.
                                </p>
                            </div>

                            {/* Auxiliary Agents */}
                            <div className="pt-6 border-t border-gray-800 mt-8">
                                <h3 className="text-lg font-bold text-white mb-4">Auxiliary Agents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Intent Analysis (Phase 1)</label>
                                        <textarea 
                                            value={localSettings.intentPrompt}
                                            onChange={(e) => setLocalSettings(prev => ({...prev, intentPrompt: e.target.value}))}
                                            className="w-full h-32 bg-black/50 border border-gray-700 rounded p-3 text-sm font-mono text-gray-300 focus:border-primary outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Editor Agent (Phase 3)</label>
                                        <textarea 
                                            value={localSettings.editingPrompt}
                                            onChange={(e) => setLocalSettings(prev => ({...prev, editingPrompt: e.target.value}))}
                                            className="w-full h-32 bg-black/50 border border-gray-700 rounded p-3 text-sm font-mono text-gray-300 focus:border-primary outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB 2: VARIABLES FORM */}
                    {promptSubTab === 'variables' && (
                        <div className="max-w-4xl space-y-6">
                            
                            <div className="bg-surface border border-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="text-emerald-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Director Persona</h3>
                                </div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tone & Performance Rules</label>
                                <textarea 
                                    value={localSettings.directorVar_director}
                                    onChange={(e) => setLocalSettings(prev => ({...prev, directorVar_director: e.target.value}))}
                                    className="w-full h-32 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white focus:border-emerald-500 outline-none"
                                    placeholder="Define how the director handles emotion, dialogue, and actors..."
                                />
                            </div>

                            <div className="bg-surface border border-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Layers className="text-blue-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Storyboard Artist</h3>
                                </div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Scene Categorization & Visual Content</label>
                                <textarea 
                                    value={localSettings.directorVar_storyboard}
                                    onChange={(e) => setLocalSettings(prev => ({...prev, directorVar_storyboard: e.target.value}))}
                                    className="w-full h-32 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white focus:border-blue-500 outline-none"
                                    placeholder="Rules for categorizing A-Roll vs B-Roll, etc..."
                                />
                            </div>

                            <div className="bg-surface border border-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clapperboard className="text-purple-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Cinematography</h3>
                                </div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Camera, Lighting & Composition</label>
                                <textarea 
                                    value={localSettings.directorVar_cinematography}
                                    onChange={(e) => setLocalSettings(prev => ({...prev, directorVar_cinematography: e.target.value}))}
                                    className="w-full h-32 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white focus:border-purple-500 outline-none"
                                    placeholder="Rules for shot sizes, camera moves, lighting..."
                                />
                            </div>

                            <div className="bg-surface border border-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileJson className="text-amber-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Script Supervisor</h3>
                                </div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Continuity & Logic</label>
                                <textarea 
                                    value={localSettings.directorVar_continuity}
                                    onChange={(e) => setLocalSettings(prev => ({...prev, directorVar_continuity: e.target.value}))}
                                    className="w-full h-32 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white focus:border-amber-500 outline-none"
                                    placeholder="Rules for scene continuity and logical flow..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: VISUAL STYLES */}
            {activeTab === 'styles' && (
                <div className="max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ImageIcon className="text-pink-400" /> Image Style Templates
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Define the full prompt structure for scene generation. Use <span className="font-mono text-primary bg-primary/10 px-1 rounded">{'{{DESCRIPTION}}'}</span> to insert the specific scene content.
                            </p>
                        </div>
                        <button onClick={addImageTemplate} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-bold shadow-lg shadow-pink-900/20">
                            <Plus size={16} /> Add Style
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {localSettings.imageStyleTemplates.map((template) => (
                            <div key={template.id} className="bg-surface border border-gray-800 p-4 rounded-xl flex gap-4 items-start shadow-sm">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                         <div className="bg-pink-900/30 p-2 rounded-lg">
                                             <Palette size={18} className="text-pink-400" />
                                         </div>
                                         <div className="flex-1">
                                             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Style Name</label>
                                             <input 
                                                type="text" 
                                                placeholder="Style Name"
                                                value={template.name}
                                                onChange={(e) => updateImageTemplate(template.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-white font-bold focus:ring-0 text-lg placeholder-gray-600"
                                            />
                                         </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block">Prompt Template</label>
                                        <textarea 
                                            placeholder="e.g. A cinematic shot of {{DESCRIPTION}}..."
                                            value={template.prompt}
                                            onChange={(e) => updateImageTemplate(template.id, 'prompt', e.target.value)}
                                            className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 font-mono h-24 focus:border-pink-500 outline-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeImageTemplate(template.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors mt-2"
                                    title="Delete Template"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;