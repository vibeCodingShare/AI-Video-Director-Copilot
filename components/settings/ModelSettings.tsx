
import React, { useState } from 'react';
import { Cpu, Image as ImageIcon, CheckCircle, Zap, Key, Shield, Globe, RotateCcw, Trash2, AlertCircle, ChevronDown, Info, ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { AppSettings, ModelConfig, ModelProvider } from '../../types';
import { callGoogleGenAI, callGoogleImageGen } from '../../services/providers/google';
import { callAnthropicText } from '../../services/providers/anthropic';
import { callOpenAICompatible, callOpenAICompatibleImageGen } from '../../services/providers/openai';
import { callJimengVisualGen } from '../../services/providers/jimeng';
import { callKlingImageGen } from '../../services/providers/kling';

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
    { value: 'qianwen', label: 'Qwen (通义千问 LLM)', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModelId: 'qwen-plus', desc: 'DashScope LLM' },
    { value: 'moonshot', label: 'Moonshot (Kimi)', defaultBaseUrl: 'https://api.moonshot.cn/v1', defaultModelId: 'moonshot-v1-8k', desc: 'Long Context' },
    { value: 'minimax', label: 'Minimax', defaultBaseUrl: 'https://api.minimax.chat/v1', defaultModelId: 'abab6.5s-chat', desc: 'Creative Writing' },
    { value: 'grok', label: 'Grok', defaultBaseUrl: 'https://api.x.ai/v1', defaultModelId: 'grok-beta', desc: 'Unfiltered Logic' },
];

const IMAGE_PROVIDERS: ProviderPreset[] = [
    { value: 'google', label: 'Google Gemini', defaultModelId: 'gemini-2.5-flash-image', desc: 'Native Image Gen' },
    { value: 'jimeng', label: 'Jimeng (即梦)', defaultBaseUrl: 'https://visual.volcengineapi.com', defaultModelId: 'jimeng_t2i_v40', desc: 'Cinematic Quality' },
    { value: 'kling', label: 'Kling AI (可灵)', defaultBaseUrl: 'https://api-beijing.klingai.com', defaultModelId: 'kling-v1', desc: 'Professional Visuals' },
    { value: 'openai-compatible', label: 'DALL-E / Generic', defaultBaseUrl: 'https://api.openai.com/v1', defaultModelId: 'dall-e-3', desc: 'Standard Image API' },
];

const TEXT_MODEL_ID_PRESETS: Record<string, string[]> = {
    'google': ['gemini-3-flash-preview', 'gemini-3-pro-preview'],
    'qianwen': ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    'deepseek': ['deepseek-chat', 'deepseek-reasoner'],
    'claude': ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    'openai-compatible': ['gpt-4o', 'gpt-4o-mini'],
    'moonshot': ['moonshot-v1-8k', 'moonshot-v1-32k'],
    'minimax': ['abab6.5s-chat'],
    'grok': ['grok-beta'],
};

const IMAGE_MODEL_ID_PRESETS: Record<string, string[]> = {
    'google': ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'],
    'kling': ['kling-v1', 'kling-v2-1', 'kling-image-o1'],
    'jimeng': ['jimeng_t2i_v40', 'jimeng_t2i_v35'],
    'openai-compatible': ['dall-e-3'],
};

interface ModelSettingsProps {
    localSettings: AppSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    t: any;
}

const isModelConfigured = (config: ModelConfig) => {
    if (config.provider === 'jimeng' || config.provider === 'kling') {
        return !!(config.accessKey && config.secretKey);
    }
    return !!config.apiKey;
};

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
                else if (config.provider === 'jimeng') await callJimengVisualGen(config, "A single red cube");
                else if (config.provider === 'kling') await callKlingImageGen(config, "A single red cube");
                else if (config.provider === 'openai-compatible') await callOpenAICompatibleImageGen(config, "A single red cube");
                else throw new Error("Provider not supported for test.");
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
    const isReady = isModelConfigured(config);
    const presets = type === 'text' ? TEXT_MODEL_ID_PRESETS[config.provider] : IMAGE_MODEL_ID_PRESETS[config.provider] || [];

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
                        <button onClick={onSetActive} className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${isReady ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700' : 'bg-amber-900/20 text-amber-500 border-amber-900/50'}`}>
                           {isReady ? t.settings.modelEditor.setActive : '未配置 Key'}
                        </button>
                    )}
                    {isActiveModel && (
                        <div className={`px-4 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1 border ${isReady ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-amber-900/40 text-amber-400 border-amber-800'}`}>
                            {isReady ? <Zap size={12} className="fill-primary" /> : <AlertCircle size={12} />} 
                            {isReady ? t.common.active : '激活 (未配置 Key)'}
                        </div>
                    )}
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.displayName}</label>
                    <input className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-primary outline-none" value={config.name} onChange={e => onUpdate({ name: e.target.value })} />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.modelId}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-primary outline-none font-mono" value={config.modelId} onChange={e => onUpdate({ modelId: e.target.value, verified: false })} />
                        </div>
                        {presets && presets.length > 0 && (
                            <div className="relative">
                                <select className="h-full bg-gray-800 border border-gray-700 rounded-lg px-3 text-xs text-gray-300 font-bold focus:border-primary outline-none appearance-none pr-8 cursor-pointer" value="" onChange={(e) => e.target.value && onUpdate({ modelId: e.target.value, verified: false })}>
                                    <option value="" disabled>选择预设</option>
                                    {presets.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>

                {isAkSk ? (
                    <>
                         <div>
                             <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.accessKey}</label>
                             <div className="relative">
                                <Key size={14} className="absolute left-3 top-3.5 text-gray-600" />
                                <input className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 pl-10 text-sm text-white focus:border-primary outline-none font-mono" type="password" value={config.accessKey || ''} onChange={e => onUpdate({ accessKey: e.target.value, verified: false })} />
                             </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.secretKey}</label>
                             <div className="relative">
                                <Shield size={14} className="absolute left-3 top-3.5 text-gray-600" />
                                <input className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 pl-10 text-sm text-white focus:border-primary outline-none font-mono" type="password" value={config.secretKey || ''} onChange={e => onUpdate({ secretKey: e.target.value, verified: false })} />
                             </div>
                        </div>
                    </>
                ) : (
                    <div>
                         <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">
                            {t.settings.modelEditor.apiKey}
                         </label>
                         <div className="relative">
                            <Key size={14} className="absolute left-3 top-3.5 text-gray-600" />
                            <input className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 pl-10 text-sm text-white focus:border-primary outline-none font-mono" type="password" value={config.apiKey} onChange={e => onUpdate({ apiKey: e.target.value, verified: false })} />
                         </div>
                    </div>
                )}
                
                {config.provider !== 'google' && (
                     <div className="col-span-1 md:col-span-2">
                        <label className="text-xs text-gray-500 font-bold uppercase mb-1.5 block">{t.settings.modelEditor.baseUrl}</label>
                        <div className="relative">
                            <Globe size={14} className="absolute left-3 top-3.5 text-gray-600" />
                            <input className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 pl-10 text-sm text-gray-300 focus:border-primary outline-none font-mono" value={config.baseUrl || ''} placeholder={config.provider === 'kling' ? 'https://api-beijing.klingai.com' : 'https://api.yourprovider.com/v1'} onChange={e => onUpdate({ baseUrl: e.target.value, verified: false })} />
                        </div>
                        
                        {(config.provider === 'kling' || config.provider === 'qianwen') && (
                            <div className="mt-4 p-4 bg-amber-900/10 border border-amber-900/30 rounded-xl space-y-4">
                                <h4 className="text-[11px] font-bold text-amber-500 uppercase flex items-center gap-2">
                                    <ShieldAlert size={14} /> 访问建议
                                </h4>
                                <div className="text-[10px] text-gray-400 leading-relaxed space-y-3">
                                    <div className="p-2 bg-black/40 rounded-lg border border-amber-900/20">
                                        <p className="font-bold text-gray-200 mb-1">解决跨域 (CORS)</p>
                                        <p>浏览器请求这些 API 常被拦截。建议使用跨域代理前缀：</p>
                                        <code className="text-white block mt-1 bg-black p-1 rounded break-all">https://cors-anywhere.herokuapp.com/[原地址]</code>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-6">
                 <div className="flex items-center gap-4">
                     <button onClick={handleTest} disabled={isTesting || !isReady} className="px-5 py-2.5 bg-white text-black font-black text-xs rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg">
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
    const isReady = config ? isModelConfigured(config) : false;
    return (
        <button onClick={onClick} className={`group p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col min-h-[90px] ${isSelected ? 'bg-white/10 border-white ring-1 ring-white shadow-xl shadow-white/5' : isActive ? 'bg-primary/10 border-primary' : config ? 'bg-surface border-gray-800' : 'bg-black/20 border-gray-800 opacity-60'}`}>
            <div className="flex justify-between items-start w-full mb-1">
                <div className="text-sm font-black truncate text-white leading-tight pr-2">{preset.label}</div>
                <div className="flex items-center gap-1 shrink-0">
                    {config?.verified && <CheckCircle size={12} className="text-emerald-500" />}
                    {isActive && <Zap size={12} className={`text-primary ${isReady ? 'fill-primary' : 'fill-none opacity-50'}`} />}
                </div>
            </div>
            <div className="text-[10px] text-gray-500 line-clamp-2 leading-tight group-hover:text-gray-400 transition-colors mb-2">{preset.desc}</div>
            <div className="mt-auto flex flex-wrap gap-1">
                {isActive && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${isReady ? 'bg-primary/20 text-primary border-primary/30' : 'bg-amber-900/40 text-amber-500 border-amber-900/50'}`}>
                        {isReady ? 'Active' : 'Missing Key'}
                    </span>
                )}
                {config?.verified && (
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">Verified</span>
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
            let nextActiveId = prev[activeKey];
            if (prev[activeKey] === id) {
                const readyModel = newList.find(m => isModelConfigured(m));
                nextActiveId = readyModel ? readyModel.id : (newList[0]?.id || '');
            }
            return { ...prev, [key]: newList, [activeKey]: nextActiveId };
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
                        return <ProviderCard key={p.value} preset={p} config={cfg} isActive={isActive} isSelected={selectedText === p.value} onClick={() => setSelectedText(p.value)} />;
                    })}
                </div>
                {selectedText && <ModelConfigEditor t={t} type="text" config={getOrCreateModel('text', TEXT_PROVIDERS.find(p => p.value === selectedText)!)} onUpdate={up => updateConfig('text', localSettings.textModels.find(m => m.provider === selectedText)!.id, up)} onDelete={() => deleteConfig('text', localSettings.textModels.find(m => m.provider === selectedText)!.id)} onSetVerified={v => updateConfig('text', localSettings.textModels.find(m => m.provider === selectedText)!.id, { verified: v })} onSetActive={() => setLocalSettings(p => ({ ...p, activeTextModelId: p.textModels.find(m => m.provider === selectedText)!.id }))} isActiveModel={localSettings.activeTextModelId === localSettings.textModels.find(m => m.provider === selectedText)?.id} />}
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
                        return <ProviderCard key={p.value} preset={p} config={cfg} isActive={isActive} isSelected={selectedImage === p.value} onClick={() => setSelectedImage(p.value)} />;
                    })}
                </div>
                {selectedImage && <ModelConfigEditor t={t} type="image" config={getOrCreateModel('image', IMAGE_PROVIDERS.find(p => p.value === selectedImage)!)} onUpdate={up => updateConfig('image', localSettings.imageModels.find(m => m.provider === selectedImage)!.id, up)} onDelete={() => deleteConfig('image', localSettings.imageModels.find(m => m.provider === selectedImage)!.id)} onSetVerified={v => updateConfig('image', localSettings.imageModels.find(m => m.provider === selectedImage)!.id, { verified: v })} onSetActive={() => setLocalSettings(p => ({ ...p, activeImageModelId: p.imageModels.find(m => m.provider === selectedImage)!.id }))} isActiveModel={localSettings.activeImageModelId === localSettings.imageModels.find(m => m.provider === selectedImage)?.id} />}
            </section>
        </div>
    );
};

export default ModelSettings;
