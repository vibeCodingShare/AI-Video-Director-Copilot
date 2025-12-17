
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { Settings, Save, RotateCcw, PenTool, Image as ImageIcon, Plus, Trash2, Cpu, Sliders, FileJson, Layers, User, Palette, CheckCircle, Key, Shield, Globe, Play, Check, AlertTriangle, Zap } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants';
import { ImageStyleTemplate, ModelConfig, ModelProvider } from '../types';

// Import providers for testing
import { callGoogleGenAI, callGoogleImageGen } from '../services/providers/google';
import { callAnthropicText } from '../services/providers/anthropic';
import { callOpenAICompatible, callOpenAICompatibleImageGen } from '../services/providers/openai';
// Note: Kling/Jimeng are expensive to test, we might warn user.

// --- Constants & Metadata ---

interface ProviderPreset {
    value: ModelProvider;
    label: string;
    defaultBaseUrl?: string;
    defaultModelId: string;
    desc?: string;
    isExperimental?: boolean;
}

const TEXT_PROVIDERS: ProviderPreset[] = [
    { value: 'google', label: 'Google Gemini', defaultModelId: 'gemini-2.5-flash', desc: 'Fast & Smart' },
    { value: 'deepseek', label: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com', defaultModelId: 'deepseek-chat', desc: 'Coding & Logic' },
    { value: 'claude', label: 'Claude', defaultBaseUrl: 'https://api.anthropic.com/v1', defaultModelId: 'claude-3-5-sonnet-20241022', desc: 'Nuanced Writing' },
    { value: 'openai-compatible', label: 'OpenAI / Generic', defaultBaseUrl: 'https://api.openai.com/v1', defaultModelId: 'gpt-4o', desc: 'Standard' },
    { value: 'qianwen', label: 'Qwen (通义千问)', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModelId: 'qwen-plus', desc: 'Balanced' },
    { value: 'moonshot', label: 'Moonshot (Kimi)', defaultBaseUrl: 'https://api.moonshot.cn/v1', defaultModelId: 'moonshot-v1-8k', desc: 'Long Context' },
    { value: 'minimax', label: 'Minimax', defaultBaseUrl: 'https://api.minimax.chat/v1', defaultModelId: 'abab6.5s-chat', desc: 'Roleplay' },
    { value: 'grok', label: 'Grok', defaultBaseUrl: 'https://api.x.ai/v1', defaultModelId: 'grok-beta', desc: 'Unfiltered' },
];

const IMAGE_PROVIDERS: ProviderPreset[] = [
    { value: 'google', label: 'Google Gemini', defaultModelId: 'gemini-2.5-flash-image', desc: 'Native Integration' },
    { value: 'jimeng', label: 'Jimeng (即梦)', defaultBaseUrl: 'https://visual.volcengineapi.com', defaultModelId: 'jimeng_t2i_v40', desc: 'High Quality' },
    { value: 'kling', label: 'Kling AI (可灵)', defaultBaseUrl: 'https://api.klingai.com/v1', defaultModelId: 'kling-v1', desc: 'Video & Image' },
    { value: 'openai-compatible', label: 'OpenAI / DALL-E', defaultBaseUrl: 'https://api.openai.com/v1', defaultModelId: 'dall-e-3', desc: 'Simple' },
];

// --- Sub-Components ---

const ModelConfigEditor: React.FC<{
    config: ModelConfig;
    type: 'text' | 'image';
    onUpdate: (updates: Partial<ModelConfig>) => void;
    onDelete: () => void;
    onSetVerified: (verified: boolean) => void;
    onSetActive: () => void;
    isActiveModel: boolean;
}> = ({ config, type, onUpdate, onDelete, onSetVerified, onSetActive, isActiveModel }) => {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; msg: string} | null>(null);

    const isAkSkProvider = config.provider === 'kling' || config.provider === 'jimeng';

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            if (type === 'text') {
                if (config.provider === 'google') {
                    await callGoogleGenAI(config, "Hello", undefined, false);
                } else if (config.provider === 'claude') {
                    await callAnthropicText(config, "Hello");
                } else {
                    // All other text providers use OpenAI format
                    await callOpenAICompatible(config, "Hello");
                }
            } else {
                // Image Test
                 if (config.provider === 'google') {
                    await callGoogleImageGen(config, "Test image");
                 } else if (config.provider === 'openai-compatible') {
                    await callOpenAICompatibleImageGen(config, "Test image");
                 } else {
                    // For Kling/Jimeng, avoid real generation to save credits, or user must accept it
                    throw new Error("Automated testing not supported for this provider to save credits. Please verify by generating a scene.");
                 }
            }
            setTestResult({ success: true, msg: "Connection Successful!" });
            onSetVerified(true);
        } catch (e: any) {
            console.error(e);
            let msg = e.message || "Unknown error";
            if (msg.includes("401")) msg = "Unauthorized (401). Check your API Key.";
            if (msg.includes("404")) msg = "Not Found (404). Check Base URL or Model ID.";
            setTestResult({ success: false, msg });
            onSetVerified(false);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-surface border border-gray-800 rounded-lg p-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Configure {config.name}
                        {config.verified && <CheckCircle size={16} className="text-emerald-500" />}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Provider: {config.provider}</p>
                 </div>
                 <div className="flex gap-2">
                    {!isActiveModel && (
                        <button onClick={onSetActive} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors border border-gray-700">
                           Set Active
                        </button>
                    )}
                    {isActiveModel && (
                        <div className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/50 text-xs rounded-lg font-bold flex items-center gap-1">
                            <Zap size={12} /> Active
                        </div>
                    )}
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Display Name</label>
                    <input 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm text-white focus:border-primary outline-none"
                        value={config.name}
                        onChange={e => onUpdate({ name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Model ID</label>
                    <input 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-sm text-white focus:border-primary outline-none"
                        value={config.modelId}
                        onChange={e => onUpdate({ modelId: e.target.value, verified: false })}
                    />
                </div>

                {isAkSkProvider ? (
                    <>
                         <div>
                             <label className="text-xs text-gray-500 block mb-1">Access Key</label>
                             <div className="relative">
                                <Key size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                                <input 
                                    className="w-full bg-black/40 border border-gray-700 rounded p-2 pl-8 text-sm text-white font-mono focus:border-primary outline-none"
                                    type="password"
                                    value={config.accessKey || ''}
                                    onChange={e => onUpdate({ accessKey: e.target.value, verified: false })}
                                />
                             </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 block mb-1">Secret Key</label>
                             <div className="relative">
                                <Shield size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                                <input 
                                    className="w-full bg-black/40 border border-gray-700 rounded p-2 pl-8 text-sm text-white font-mono focus:border-primary outline-none"
                                    type="password"
                                    value={config.secretKey || ''}
                                    onChange={e => onUpdate({ secretKey: e.target.value, verified: false })}
                                />
                             </div>
                        </div>
                    </>
                ) : (
                    <div>
                         <label className="text-xs text-gray-500 block mb-1">API Key</label>
                         <div className="relative">
                            <Key size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                            <input 
                                className="w-full bg-black/40 border border-gray-700 rounded p-2 pl-8 text-sm text-white font-mono focus:border-primary outline-none"
                                type="password"
                                value={config.apiKey}
                                onChange={e => onUpdate({ apiKey: e.target.value, verified: false })}
                            />
                         </div>
                    </div>
                )}

                {config.provider !== 'google' && (
                     <div className="col-span-1 md:col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">Base URL (Endpoint)</label>
                        <div className="relative">
                            <Globe size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                            <input 
                                className="w-full bg-black/40 border border-gray-700 rounded p-2 pl-8 text-sm text-gray-300 font-mono focus:border-primary outline-none"
                                value={config.baseUrl || ''}
                                onChange={e => onUpdate({ baseUrl: e.target.value, verified: false })}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={handleTestConnection} 
                        disabled={isTesting}
                        className="px-4 py-2 bg-white text-black font-bold text-xs rounded hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                     >
                        {isTesting ? <RotateCcw size={12} className="animate-spin"/> : <CheckCircle size={12} />}
                        {isTesting ? 'Testing...' : 'Test Connection'}
                     </button>
                     {testResult && (
                         <span className={`text-xs font-bold ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                             {testResult.msg}
                         </span>
                     )}
                 </div>
                 
                 <button onClick={onDelete} className="text-gray-500 hover:text-red-400 p-2 rounded transition-colors" title="Delete Configuration">
                     <Trash2 size={16} />
                 </button>
            </div>
        </div>
    );
}

// --- Main Component ---

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<'basic' | 'llm' | 'prompts' | 'styles'>('basic');
  
  // State for which pill/provider is selected for editing
  // We use the Provider Value as the key for the tab
  const [selectedTextProvider, setSelectedTextProvider] = useState<ModelProvider | null>(null);
  const [selectedImageProvider, setSelectedImageProvider] = useState<ModelProvider | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    updateSettings(localSettings);
    alert('Settings saved successfully');
  };

  const handleReset = () => {
    if(confirm("Reset all settings and prompts to default?")) {
        setLocalSettings(DEFAULT_SETTINGS);
        updateSettings(DEFAULT_SETTINGS); 
    }
  };

  const handleTabChange = (tabId: 'basic' | 'llm' | 'prompts' | 'styles') => {
      setActiveTab(tabId);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  // --- MODEL LOGIC ---

  const getOrCreateModel = (type: 'text' | 'image', preset: ProviderPreset): ModelConfig => {
      const list = type === 'text' ? localSettings.textModels : localSettings.imageModels;
      const existing = list.find(m => m.provider === preset.value);
      
      if (existing) return existing;

      // Create new with preset defaults
      const newConfig: ModelConfig = {
          id: crypto.randomUUID(),
          name: preset.label,
          provider: preset.value,
          apiKey: '',
          baseUrl: preset.defaultBaseUrl || '',
          modelId: preset.defaultModelId,
          verified: false
      };

      // Add to local state immediately so UI updates
      if (type === 'text') {
          setLocalSettings(prev => ({ ...prev, textModels: [...prev.textModels, newConfig] }));
      } else {
          setLocalSettings(prev => ({ ...prev, imageModels: [...prev.imageModels, newConfig] }));
      }
      return newConfig;
  };

  const handlePillClick = (type: 'text' | 'image', preset: ProviderPreset) => {
      // Just select the tab. The render logic handles creating/finding the config.
      if (type === 'text') setSelectedTextProvider(preset.value);
      else setSelectedImageProvider(preset.value);
  };

  // Update specific config in the list
  const updateConfig = (type: 'text' | 'image', id: string, updates: Partial<ModelConfig>) => {
      const listKey = type === 'text' ? 'textModels' : 'imageModels';
      setLocalSettings(prev => ({
          ...prev,
          [listKey]: prev[listKey].map(m => m.id === id ? { ...m, ...updates } : m)
      }));
  };

  const deleteConfig = (type: 'text' | 'image', id: string) => {
      if(!confirm("Remove this configuration?")) return;
      const listKey = type === 'text' ? 'textModels' : 'imageModels';
      const activeIdKey = type === 'text' ? 'activeTextModelId' : 'activeImageModelId';
      
      setLocalSettings(prev => {
          const newList = prev[listKey].filter(m => m.id !== id);
          const newState = { ...prev, [listKey]: newList };
          
          // If we deleted the active one, fallback to first available or empty string
          if (prev[activeIdKey] === id) {
             (newState as any)[activeIdKey] = newList[0]?.id || '';
          }
          return newState;
      });

      // Deselect tab if we deleted the current one
      if (type === 'text') setSelectedTextProvider(null);
      else setSelectedImageProvider(null);
  };

  const setActiveModel = (type: 'text' | 'image', id: string) => {
      if (type === 'text') setLocalSettings(prev => ({ ...prev, activeTextModelId: id }));
      else setLocalSettings(prev => ({ ...prev, activeImageModelId: id }));
  };

  // --- Sub Tabs for Prompts ---
  const [promptSubTab, setPromptSubTab] = useState<'template' | 'variables' | 'workflow'>('template');
  
  // --- Image Style Template Logic ---
  const addImageTemplate = () => {
    const newTemplate: ImageStyleTemplate = {
      id: crypto.randomUUID(),
      name: 'New Custom Style',
      prompt: 'Describe the visual style here... Use {{DESCRIPTION}} to insert the scene description.'
    };
    setLocalSettings(prev => ({
      ...prev,
      imageStyleTemplates: [newTemplate, ...prev.imageStyleTemplates]
    }));
  };
  const removeImageTemplate = (id: string) => {
    if (!confirm("Are you sure you want to remove this style template?")) return;
    setLocalSettings(prev => ({
      ...prev,
      imageStyleTemplates: prev.imageStyleTemplates.filter(t => t.id !== id)
    }));
  };

  const tabs = [
      { id: 'basic', label: 'Basic', icon: Sliders },
      { id: 'llm', label: 'Models', icon: Cpu },
      { id: 'prompts', label: 'Prompts', icon: PenTool },
      { id: 'styles', label: 'Styles', icon: Palette },
  ];

  return (
    <div className="h-full flex flex-col bg-background text-gray-200">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center shrink-0 gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 truncate">
            <Settings className="text-primary shrink-0" /> <span className="hidden sm:inline">Configuration</span><span className="sm:hidden">Settings</span>
        </h1>
        <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors">
                <RotateCcw size={14} /> <span className="hidden sm:inline">Defaults</span>
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm">
                <Save size={16} /> Save
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-surface md:border-r border-b md:border-b-0 border-gray-800 p-2 md:p-4 grid grid-cols-4 md:flex md:flex-col md:overflow-y-auto shrink-0 gap-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`flex items-center justify-center md:justify-start gap-2 px-2 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all truncate border ${
                        activeTab === tab.id 
                        ? 'bg-primary/20 text-white border-primary/50' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-transparent'
                    }`}
                >
                    <tab.icon size={16} className="shrink-0" />
                    <span className="hidden md:inline truncate">{tab.label}</span>
                </button>
            ))}
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            
            {activeTab === 'basic' && (
                <div className="p-4 md:p-8 max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <h2 className="text-xl font-bold mb-4 text-white">General Preferences</h2>
                   <div className="bg-surface border border-gray-800 rounded-lg divide-y divide-gray-800">
                        <div className="p-4 flex items-center justify-between">
                            <div className="pr-4">
                                <div className="font-medium text-white">Enable Intent Analysis</div>
                                <div className="text-xs text-gray-500">Analyze raw input before scripting.</div>
                            </div>
                            <button 
                                onClick={() => setLocalSettings(prev => ({...prev, enableIntentAnalysis: !prev.enableIntentAnalysis}))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${localSettings.enableIntentAnalysis ? 'bg-primary' : 'bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.enableIntentAnalysis ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="pr-4">
                                <div className="font-medium text-white">Auto-Generate Images</div>
                                <div className="text-xs text-gray-500">Auto-create storyboard images on script generation.</div>
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
            )}
            
            {activeTab === 'llm' && (
                <div className="p-4 md:p-8 max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
                    
                    {/* TEXT MODELS SECTION */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                             <h2 className="text-xl font-bold text-white">Script Models (LLM)</h2>
                        </div>

                        {/* Pills Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                            {TEXT_PROVIDERS.map(preset => {
                                const config = localSettings.textModels.find(m => m.provider === preset.value);
                                const isConfigured = !!config;
                                const isVerified = config?.verified;
                                const isActive = config?.id === localSettings.activeTextModelId;
                                const isSelected = selectedTextProvider === preset.value;

                                return (
                                    <button
                                        key={preset.value}
                                        onClick={() => handlePillClick('text', preset)}
                                        className={`relative group flex flex-col items-start p-3 rounded-xl border transition-all text-left h-full ${
                                            isSelected
                                            ? 'bg-white/10 border-white ring-1 ring-white shadow-lg'
                                            : isActive 
                                                ? 'bg-primary/10 border-primary shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]' 
                                                : isConfigured 
                                                    ? 'bg-surface border-gray-700 hover:border-gray-500' 
                                                    : 'bg-black/20 border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex justify-between w-full items-start mb-1 gap-2">
                                            <span className={`text-sm font-bold truncate ${isSelected || isActive ? 'text-white' : 'text-gray-300'}`}>{preset.label}</span>
                                            {/* Status Dot */}
                                            {isConfigured && (
                                                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                                    isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'
                                                }`} title={isVerified ? "Verified" : "Not Verified"} />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-500 leading-tight">{preset.desc}</span>
                                        {isActive && <div className="absolute top-2 right-2 text-primary font-bold text-[10px] bg-primary/20 px-1.5 py-0.5 rounded">ACTIVE</div>}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Editor for Selected Text Provider */}
                        {selectedTextProvider && (
                            <ModelConfigEditor 
                                config={getOrCreateModel('text', TEXT_PROVIDERS.find(p => p.value === selectedTextProvider)!)}
                                type="text"
                                onUpdate={(updates) => updateConfig('text', localSettings.textModels.find(m => m.provider === selectedTextProvider)!.id, updates)}
                                onDelete={() => deleteConfig('text', localSettings.textModels.find(m => m.provider === selectedTextProvider)!.id)}
                                onSetVerified={(verified) => updateConfig('text', localSettings.textModels.find(m => m.provider === selectedTextProvider)!.id, { verified })}
                                onSetActive={() => setActiveModel('text', localSettings.textModels.find(m => m.provider === selectedTextProvider)!.id)}
                                isActiveModel={localSettings.activeTextModelId === localSettings.textModels.find(m => m.provider === selectedTextProvider)?.id}
                            />
                        )}
                    </section>

                    <div className="h-px bg-gray-800"></div>

                    {/* IMAGE MODELS SECTION */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                             <h2 className="text-xl font-bold text-white">Storyboard Models (Image)</h2>
                        </div>

                         {/* Pills Grid */}
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                            {IMAGE_PROVIDERS.map(preset => {
                                const config = localSettings.imageModels.find(m => m.provider === preset.value);
                                const isConfigured = !!config;
                                const isVerified = config?.verified;
                                const isActive = config?.id === localSettings.activeImageModelId;
                                const isSelected = selectedImageProvider === preset.value;

                                return (
                                    <button
                                        key={preset.value}
                                        onClick={() => handlePillClick('image', preset)}
                                        className={`relative group flex flex-col items-start p-3 rounded-xl border transition-all text-left h-full ${
                                            isSelected
                                            ? 'bg-white/10 border-white ring-1 ring-white shadow-lg'
                                            : isActive 
                                                ? 'bg-primary/10 border-primary shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]' 
                                                : isConfigured 
                                                    ? 'bg-surface border-gray-700 hover:border-gray-500' 
                                                    : 'bg-black/20 border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex justify-between w-full items-start mb-1 gap-2">
                                            <span className={`text-sm font-bold truncate ${isSelected || isActive ? 'text-white' : 'text-gray-300'}`}>{preset.label}</span>
                                            {isConfigured && (
                                                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                                    isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-600'
                                                }`} title={isVerified ? "Verified" : "Not Verified"} />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-500 leading-tight">{preset.desc}</span>
                                        {isActive && <div className="absolute top-2 right-2 text-primary font-bold text-[10px] bg-primary/20 px-1.5 py-0.5 rounded">ACTIVE</div>}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Editor for Selected Image Provider */}
                        {selectedImageProvider && (
                            <ModelConfigEditor 
                                config={getOrCreateModel('image', IMAGE_PROVIDERS.find(p => p.value === selectedImageProvider)!)}
                                type="image"
                                onUpdate={(updates) => updateConfig('image', localSettings.imageModels.find(m => m.provider === selectedImageProvider)!.id, updates)}
                                onDelete={() => deleteConfig('image', localSettings.imageModels.find(m => m.provider === selectedImageProvider)!.id)}
                                onSetVerified={(verified) => updateConfig('image', localSettings.imageModels.find(m => m.provider === selectedImageProvider)!.id, { verified })}
                                onSetActive={() => setActiveModel('image', localSettings.imageModels.find(m => m.provider === selectedImageProvider)!.id)}
                                isActiveModel={localSettings.activeImageModelId === localSettings.imageModels.find(m => m.provider === selectedImageProvider)?.id}
                            />
                        )}
                    </section>
                </div>
            )}
            
            {activeTab === 'prompts' && (
                <div className="flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
                    <div className="sticky top-0 bg-background z-20 px-4 md:px-8 pt-4 md:pt-6 pb-2 border-b border-gray-800 flex items-center gap-6 overflow-x-auto">
                        <button onClick={() => setPromptSubTab('template')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${promptSubTab === 'template' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                            <FileJson size={14} className="inline mr-2" /> System Instruction
                        </button>
                        <button onClick={() => setPromptSubTab('variables')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${promptSubTab === 'variables' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                            <Layers size={14} className="inline mr-2" /> Variables
                        </button>
                        <button onClick={() => setPromptSubTab('workflow')} className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${promptSubTab === 'workflow' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                            <Play size={14} className="inline mr-2" /> Workflow Prompts
                        </button>
                    </div>

                    <div className="px-4 md:px-8 py-6">
                        {promptSubTab === 'template' && (
                            <div className="space-y-6 max-w-4xl">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-white">Main System Instruction</h3>
                                        <button onClick={() => setLocalSettings(prev => ({...prev, directorMainPrompt: DEFAULT_SETTINGS.directorMainPrompt}))} className="text-xs text-gray-500 hover:text-white">Reset Default</button>
                                    </div>
                                    <textarea 
                                        value={localSettings.directorMainPrompt}
                                        onChange={(e) => setLocalSettings(prev => ({...prev, directorMainPrompt: e.target.value}))}
                                        className="w-full h-80 bg-black/50 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                        )}
                        {/* Variables and Workflow subtabs logic maintained from previous, simplified for brevity here since focus was on LLM tab */}
                        {promptSubTab === 'variables' && (
                            <div className="max-w-4xl space-y-6">
                                 <div className="bg-surface border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><User size={16}/> Director</h3>
                                    <textarea value={localSettings.directorVar_director} onChange={e => setLocalSettings(prev => ({...prev, directorVar_director: e.target.value}))} className="w-full h-32 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white outline-none"/>
                                </div>
                                 <div className="bg-surface border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Layers size={16}/> Storyboard</h3>
                                    <textarea value={localSettings.directorVar_storyboard} onChange={e => setLocalSettings(prev => ({...prev, directorVar_storyboard: e.target.value}))} className="w-full h-32 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white outline-none"/>
                                </div>
                            </div>
                        )}
                        {promptSubTab === 'workflow' && (
                            <div className="max-w-4xl space-y-6">
                                <div className="bg-surface border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-white mb-2">Intent Analysis</h3>
                                    <textarea value={localSettings.intentPrompt} onChange={e => setLocalSettings(prev => ({...prev, intentPrompt: e.target.value}))} className="w-full h-40 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white outline-none"/>
                                </div>
                                <div className="bg-surface border border-gray-800 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-white mb-2">Editing Plan</h3>
                                    <textarea value={localSettings.editingPrompt} onChange={e => setLocalSettings(prev => ({...prev, editingPrompt: e.target.value}))} className="w-full h-40 bg-black/30 border border-gray-700 rounded p-3 text-sm font-mono text-white outline-none"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'styles' && (
                <div className="p-4 md:p-8 max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><ImageIcon className="text-pink-400" /> Image Styles</h2>
                        <button onClick={addImageTemplate} className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-pink-900/20"><Plus size={16} /> Add</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {localSettings.imageStyleTemplates.map((template) => (
                            <div key={template.id} className="bg-surface border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start shadow-sm">
                                <div className="flex-1 space-y-3 w-full">
                                     <input type="text" value={template.name} onChange={(e) => {
                                         const newTemplates = localSettings.imageStyleTemplates.map(t => t.id === template.id ? {...t, name: e.target.value} : t);
                                         setLocalSettings(prev => ({...prev, imageStyleTemplates: newTemplates}));
                                     }} className="w-full bg-transparent border-none p-0 text-white font-bold text-lg"/>
                                     <textarea value={template.prompt} onChange={(e) => {
                                         const newTemplates = localSettings.imageStyleTemplates.map(t => t.id === template.id ? {...t, prompt: e.target.value} : t);
                                         setLocalSettings(prev => ({...prev, imageStyleTemplates: newTemplates}));
                                     }} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 font-mono h-24 outline-none"/>
                                </div>
                                <button onClick={() => removeImageTemplate(template.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={16}/></button>
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
