
import React, { useState } from 'react';
import { Cpu, Image as ImageIcon, CheckCircle, Zap, Key, Shield, Globe, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { AppSettings, ModelConfig, ModelProvider } from '../../types';
import { callGoogleGenAI, callGoogleImageGen } from '../../services/providers/google';
import { callAnthropicText } from '../../services/providers/anthropic';
import { callOpenAICompatible, callOpenAICompatibleImageGen } from '../../services/providers/openai';

interface ProviderPreset {
    value: ModelProvider;
    label: string;
    defaultBaseUrl?: string;
    defaultModelId: string;
    desc?: string;
}

const TEXT_PROVIDERS: ProviderPreset[] = [
    { value: 'google', label: 'Google Gemini', defaultModelId: 'gemini-3-flash-preview', desc: 'Fast & Multimodal' },
    { value: 'deepseek', label: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com', defaultModelId: 'deepseek-chat', desc: 'Coding & Reason' },
    { value: 'claude', label: 'Claude', defaultBaseUrl: 'https://api.anthropic.com/v1', defaultModelId: 'claude-3-5-sonnet-latest', desc: 'Nuance & Creative' },
    { value: 'openai-compatible', label: 'OpenAI / Generic', defaultBaseUrl: 'https://api.openai.com/v1', defaultModelId: 'gpt-4o', desc: 'Industry Standard' },
    { value: 'qianwen', label: 'Qwen (通义千问)', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModelId: 'qwen-plus', desc: 'Balanced Performance' },
    { value: 'moonshot', label: 'Moonshot (Kimi)', defaultBaseUrl: 'https://api.moonshot.cn/v1', defaultModelId: 'moonshot-v1-8k', desc: 'Long Context' },
    { value: 'minimax', label: 'Minimax', defaultBaseUrl: 'https://api.minimax.chat/v1', defaultModelId: 'abab6.5s-chat', desc: 'Creative Writing' },
    { value: 'grok', label: 'Grok', defaultBaseUrl: 'https://api.x.ai/v1', defaultModelId: 'grok-beta', desc: 'Unfiltered Logic' },
];

const IMAGE_PROVIDERS: ProviderPreset[] = [
    { value: 'google', label: 'Google Gemini', defaultModelId: 'gemini-2.5-flash-image', desc: 'Native Image Gen' },
    { value: 'jimeng', label: 'Jimeng (即梦)', defaultBaseUrl: 'https://visual.volcengineapi.com', defaultModelId: 'jimeng_t2i_v40', desc: 'Cinematic Quality' },
    { value: 'kling', label: 'Kling AI (可灵)', defaultBaseUrl: 'https://api.klingai.com/v1', defaultModelId: 'kling-v1', desc: 'Professional Visuals' },
    { value: 'openai-compatible', label: 'DALL-E / Generic', defaultBaseUrl: 'https://api.openai.com/v1', defaultModelId: 'dall-e-3', desc: 'Standard Image API' },
];

interface ModelSettingsProps {
    localSettings: AppSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    t: any;
}

const ModelConfigEditor: React.FC<{
    config: ModelConfig;
    type: 'text' | 'image';
    onUpdate: (updates: Partial<ModelConfig>) => void;
    onDelete: () => void;
    onSetVerified: (verified: boolean) => void;
    onSetActive: () => void;
    isActiveModel: boolean;
    t: any;
}> = ({ config, type, onUpdate, onDelete, onSetVerified, onSetActive, isActiveModel, t }) => {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; msg: string} | null>(null);

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            if (type === 'text') {
                if (config.provider === 'google') await callGoogleGenAI(config, "Hello");
                else if (config.provider === 'claude') await callAnthropicText(config, "Hello");
                else await callOpenAICompatible(config, "Hello");
            } else {
                if (config.provider === 'google') await callGoogleImageGen(config, "A single red cube");
                else if (config.provider === 'openai-compatible') await callOpenAICompatibleImageGen(config, "A single red cube");
                else throw new Error("This provider requires backend proxy for testing.");
            }
            setTestResult({ success: true, msg: "Connection OK" });
            onSetVerified(true);
        } catch (e: any) {
            setTestResult({ success: false, msg: e.message || "Connection Failed" });
            onSetVerified(false);
        } finally {
            setIsTesting(false);
        }
    };

    const isAkSk = config.provider === 'kling' || config.provider === 'jimeng';

    return (
        <div className="bg-surface border border-gray-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {config.name}
                        {config.verified && <CheckCircle size={16} className="text-emerald-500" />}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-mono">Provider: {config.provider}</p>
                 </div>
                 <div className="flex gap-2">
                    {!isActiveModel && (
                        <button onClick={onSetActive} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg border border-gray-700 transition-all">
                           {t.settings.modelEditor.setActive}
                        </button>
                    )}
                    {isActiveModel && (
                        <div className="px-4 py-1.5 bg-primary/20 text-primary border border-primary/50 text-xs rounded-lg font-bold flex items-center gap-1">
                            <Zap size={12} /> {t.common.active}
                        </div>
                    )}
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.displayName}</label>
                    <input className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-primary outline-none" value={config.name} onChange={e => onUpdate({ name: e.target.value })} />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.modelId}</label>
                    <input className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-primary outline-none font-mono" value={config.modelId} onChange={e => onUpdate({ modelId: e.target.value, verified: false })} />
                </div>
                {isAkSk ? (
                    <>
                         <div>
                             <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.accessKey}</label>
                             <div className="relative">
                                <Key size={14} className="absolute left-3 top-3.5 text-gray-600" />
                                <input className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-primary outline-none font-mono" type="password" value={config.accessKey || ''} onChange={e => onUpdate({ accessKey: e.target.value, verified: false })} />
                             </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.secretKey}</label>
                             <div className="relative">
                                <Shield size={14} className="absolute left-3 top-3.5 text-gray-600" />
                                <input className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-primary outline-none font-mono" type="password" value={config.secretKey || ''} onChange={e => onUpdate({ secretKey: e.target.value, verified: false })} />
                             </div>
                        </div>
                    </>
                ) : (
                    <div>
                         <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.apiKey}</label>
                         <div className="relative">
                            <Key size={14} className="absolute left-3 top-3.5 text-gray-600" />
                            <input className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-primary outline-none font-mono" type="password" value={config.apiKey} onChange={e => onUpdate({ apiKey: e.target.value, verified: false })} />
                         </div>
                    </div>
                )}
                {config.provider !== 'google' && (
                     <div className="col-span-1 md:col-span-2">
                        <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.baseUrl}</label>
                        <div className="relative">
                            <Globe size={14} className="absolute left-3 top-3.5 text-gray-600" />
                            <input className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-gray-300 focus:border-primary outline-none font-mono" value={config.baseUrl || ''} placeholder="https://api.yourprovider.com/v1" onChange={e => onUpdate({ baseUrl: e.target.value, verified: false })} />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-6">
                 <div className="flex items-center gap-4">
                     <button onClick={handleTest} disabled={isTesting} className="px-5 py-2.5 bg-white text-black font-black text-xs rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg">
                        {isTesting ? <RotateCcw size={14} className="animate-spin"/> : <CheckCircle size={14} />}
                        {isTesting ? t.common.testing : t.common.test}
                     </button>
                     {testResult && (
                         <div className={`flex items-center gap-1 text-xs font-bold ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                             {!testResult.success && <AlertCircle size={12} />}
                             {testResult.msg}
                         </div>
                     )}
                 </div>
                 <button onClick={onDelete} className="p-2 text-gray-600 hover:text-red-500 transition-colors" title={t.common.delete}>
                    <Trash2 size={18} />
                 </button>
            </div>
        </div>
    );
};

const ProviderCard: React.FC<{
    preset: ProviderPreset;
    config?: ModelConfig;
    isActive: boolean;
    isSelected: boolean;
    onClick: () => void;
}> = ({ preset, config, isActive, isSelected, onClick }) => {
    return (
        <button 
            onClick={onClick} 
            className={`group p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col min-h-[90px] ${
                isSelected 
                ? 'bg-white/10 border-white ring-1 ring-white shadow-xl shadow-white/5' 
                : isActive 
                ? 'bg-primary/10 border-primary' 
                : config 
                ? 'bg-surface border-gray-700' 
                : 'bg-black/20 border-gray-800 opacity-60'
            }`}
        >
            {/* Top row with label and status icons */}
            <div className="flex justify-between items-start w-full mb-1">
                <div className="text-sm font-black truncate text-white leading-tight pr-2">{preset.label}</div>
                <div className="flex items-center gap-1 shrink-0">
                    {config?.verified && <CheckCircle size={12} className="text-emerald-500" />}
                    {isActive && <Zap size={12} className="text-primary fill-primary/30" />}
                </div>
            </div>

            {/* Description */}
            <div className="text-[10px] text-gray-500 line-clamp-2 leading-tight group-hover:text-gray-400 transition-colors mb-2">
                {preset.desc}
            </div>

            {/* Status Pills */}
            <div className="mt-auto flex flex-wrap gap-1">
                {isActive && (
                    <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/30 uppercase tracking-tighter">
                        Active
                    </span>
                )}
                {config?.verified && (
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">
                        Verified
                    </span>
                )}
            </div>
        </button>
    );
};

const ModelSettings: React.FC<ModelSettingsProps> = ({ localSettings, setLocalSettings, t }) => {
    const [selectedText, setSelectedText] = useState<ModelProvider | null>(localSettings.textModels.find(m => m.id === localSettings.activeTextModelId)?.provider || null);
    const [selectedImage, setSelectedImage] = useState<ModelProvider | null>(localSettings.imageModels.find(m => m.id === localSettings.activeImageModelId)?.provider || null);

    const getOrCreateModel = (type: 'text' | 'image', preset: ProviderPreset) => {
        const list = type === 'text' ? localSettings.textModels : localSettings.imageModels;
        const existing = list.find(m => m.provider === preset.value);
        if (existing) return existing;
        const newCfg: ModelConfig = { id: crypto.randomUUID(), name: preset.label, provider: preset.value, apiKey: '', baseUrl: preset.defaultBaseUrl || '', modelId: preset.defaultModelId, verified: false };
        if (type === 'text') setLocalSettings(p => ({ ...p, textModels: [...p.textModels, newCfg] }));
        else setLocalSettings(p => ({ ...p, imageModels: [...p.imageModels, newCfg] }));
        return newCfg;
    };

    const updateConfig = (type: 'text' | 'image', id: string, updates: Partial<ModelConfig>) => {
        const key = type === 'text' ? 'textModels' : 'imageModels';
        setLocalSettings(prev => ({ ...prev, [key]: prev[key].map(m => m.id === id ? { ...m, ...updates } : m) }));
    };

    const deleteConfig = (type: 'text' | 'image', id: string) => {
        const key = type === 'text' ? 'textModels' : 'imageModels';
        const activeKey = type === 'text' ? 'activeTextModelId' : 'activeImageModelId';
        setLocalSettings(prev => {
            const newList = prev[key].filter(m => m.id !== id);
            const newState = { ...prev, [key]: newList };
            if (prev[activeKey] === id) { (newState as any)[activeKey] = newList[0]?.id || ''; }
            return newState;
        });
        if (type === 'text') setSelectedText(null);
        else setSelectedImage(null);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
            <section>
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Cpu size={24} className="text-blue-400" /> {t.settings.llmModels}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Configure language models for scriptwriting and creative direction.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {TEXT_PROVIDERS.map(p => {
                        const cfg = localSettings.textModels.find(m => m.provider === p.value);
                        const isActive = cfg?.id === localSettings.activeTextModelId;
                        return (
                            <ProviderCard 
                                key={p.value}
                                preset={p}
                                config={cfg}
                                isActive={isActive}
                                isSelected={selectedText === p.value}
                                onClick={() => setSelectedText(p.value)}
                            />
                        );
                    })}
                </div>
                {selectedText && (
                    <ModelConfigEditor 
                        t={t} 
                        type="text" 
                        config={getOrCreateModel('text', TEXT_PROVIDERS.find(p => p.value === selectedText)!)} 
                        onUpdate={up => updateConfig('text', localSettings.textModels.find(m => m.provider === selectedText)!.id, up)} 
                        onDelete={() => deleteConfig('text', localSettings.textModels.find(m => m.provider === selectedText)!.id)} 
                        onSetVerified={v => updateConfig('text', localSettings.textModels.find(m => m.provider === selectedText)!.id, { verified: v })} 
                        onSetActive={() => setLocalSettings(p => ({ ...p, activeTextModelId: p.textModels.find(m => m.provider === selectedText)!.id }))} 
                        isActiveModel={localSettings.activeTextModelId === localSettings.textModels.find(m => m.provider === selectedText)?.id} 
                    />
                )}
            </section>

            <div className="h-px bg-gray-800/50"></div>

            <section>
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <ImageIcon size={24} className="text-pink-400" /> {t.settings.imgModels}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Configure AI image generators for your storyboard visuals.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {IMAGE_PROVIDERS.map(p => {
                        const cfg = localSettings.imageModels.find(m => m.provider === p.value);
                        const isActive = cfg?.id === localSettings.activeImageModelId;
                        return (
                            <ProviderCard 
                                key={p.value}
                                preset={p}
                                config={cfg}
                                isActive={isActive}
                                isSelected={selectedImage === p.value}
                                onClick={() => setSelectedImage(p.value)}
                            />
                        );
                    })}
                </div>
                {selectedImage && (
                    <ModelConfigEditor 
                        t={t} 
                        type="image" 
                        config={getOrCreateModel('image', IMAGE_PROVIDERS.find(p => p.value === selectedImage)!)} 
                        onUpdate={up => updateConfig('image', localSettings.imageModels.find(m => m.provider === selectedImage)!.id, up)} 
                        onDelete={() => deleteConfig('image', localSettings.imageModels.find(m => m.provider === selectedImage)!.id)} 
                        onSetVerified={v => updateConfig('image', localSettings.imageModels.find(m => m.provider === selectedImage)!.id, { verified: v })} 
                        onSetActive={() => setLocalSettings(p => ({ ...p, activeImageModelId: p.imageModels.find(m => m.provider === selectedImage)!.id }))} 
                        isActiveModel={localSettings.activeImageModelId === localSettings.imageModels.find(m => m.provider === selectedImage)?.id} 
                    />
                )}
            </section>
        </div>
    );
};

export default ModelSettings;
