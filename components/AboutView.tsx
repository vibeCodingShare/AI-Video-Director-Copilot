
import React from 'react';
import { useAppStore } from '../store/AppContext';
import { translations } from '../translations';
import { Video, Code, Layout, Sparkles, Wand2, ShieldCheck, Heart, Github, Globe } from 'lucide-react';

const AboutView: React.FC = () => {
    const { settings } = useAppStore();
    const t = translations[settings.language || 'zh'];

    return (
        <div className="h-full overflow-y-auto bg-background p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-primary/20 rounded-2xl mb-4 border border-primary/30 shadow-2xl shadow-primary/10">
                        <Video size={48} className="text-primary" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">{t.about.title}</h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">{t.about.hero}</p>
                </div>

                {/* Main Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <Sparkles size={18} className="text-amber-400" /> {t.about.pillars.script.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.script.desc}</p>
                    </div>
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <Layout size={18} className="text-blue-400" /> {t.about.pillars.story.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.story.desc}</p>
                    </div>
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <Wand2 size={18} className="text-purple-400" /> {t.about.pillars.edit.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.edit.desc}</p>
                    </div>
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <ShieldCheck size={18} className="text-emerald-400" /> {t.about.pillars.privacy.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.privacy.desc}</p>
                    </div>
                </div>

                <div className="h-px bg-gray-800"></div>

                {/* Developer Info */}
                <div className="bg-surface border border-gray-800 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Code size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-tr from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold">SE</div>
                            <div>
                                <h4 className="text-white font-bold">{t.about.dev.title}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{t.about.dev.subtitle}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed italic">{t.about.dev.quote}</p>
                        <div className="flex gap-6 pt-4">
                             <a href="#" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"><Github size={14} /> Github</a>
                             <a href="#" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"><Globe size={14} /> Portfolio</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutView;
