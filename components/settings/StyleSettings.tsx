
import React from 'react';
import { Palette, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { AppSettings, ImageStyleTemplate } from '../../types';
import SharedPromptEditor from './SharedPromptEditor';

interface StyleSettingsProps {
    localSettings: AppSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    t: any;
}

const StyleSettings: React.FC<StyleSettingsProps> = ({ localSettings, setLocalSettings, t }) => {
    const handleAddStyle = () => {
        const newStyle: ImageStyleTemplate = { 
            id: crypto.randomUUID(), 
            name: 'New Custom Style', 
            prompt: 'High quality cinematic shot of {{DESCRIPTION}}, professional studio lighting, detailed textures.' 
        };
        setLocalSettings(p => ({ ...p, imageStyleTemplates: [newStyle, ...p.imageStyleTemplates] }));
    };

    const handleUpdateStyle = (id: string, updates: Partial<ImageStyleTemplate>) => {
        setLocalSettings(prev => ({
            ...prev,
            imageStyleTemplates: prev.imageStyleTemplates.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    const handleDeleteStyle = (id: string) => {
        if (confirm("Delete this style template?")) {
            setLocalSettings(prev => ({
                ...prev,
                imageStyleTemplates: prev.imageStyleTemplates.filter(s => s.id !== id)
            }));
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <ImageIcon size={24} className="text-pink-400" /> {t.settings.styles}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage visual presets for automated storyboard images.</p>
                </div>
                <button 
                    onClick={handleAddStyle} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-black shadow-lg shadow-pink-600/20 transition-all active:scale-95"
                >
                    <Plus size={18} /> {t.settings.styleAdd}
                </button>
            </div>

            <div className="space-y-6">
                {localSettings.imageStyleTemplates.map((template) => (
                    <div key={template.id} className="relative group">
                        <SharedPromptEditor 
                            title={template.name}
                            description="Visual context for AI generation. Use {{DESCRIPTION}} placeholder."
                            value={template.prompt}
                            onChange={(val) => handleUpdateStyle(template.id, { prompt: val })}
                            icon={Palette}
                            iconColorClass="text-pink-400"
                            heightClass="h-32"
                            placeholder="Describe the aesthetic..."
                            badge="Image Style"
                            footer={
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={template.name} 
                                            onChange={(e) => handleUpdateStyle(template.id, { name: e.target.value })} 
                                            className="bg-black/30 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-pink-500 outline-none w-48 transition-all"
                                            placeholder="Style name..."
                                        />
                                        <span className="text-[10px] text-gray-600 font-mono uppercase">Template Name</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteStyle(template.id)} 
                                        className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all text-xs font-bold"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            }
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StyleSettings;
