
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { translations } from '../translations';
import { Video, Code, Layout, Sparkles, Wand2, ShieldCheck, Heart, Zap, ExternalLink, Image as ImageIcon } from 'lucide-react';

const AboutView: React.FC = () => {
    const { settings } = useAppStore();
    const t = translations[settings.language || 'zh'];
    const [imgError, setImgError] = useState(false);

    return (
        <div className="h-full overflow-y-auto bg-background p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
                
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
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-primary/30 transition-colors">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <Sparkles size={18} className="text-amber-400" /> {t.about.pillars.script.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.script.desc}</p>
                    </div>
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-primary/30 transition-colors">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <Layout size={18} className="text-blue-400" /> {t.about.pillars.story.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.story.desc}</p>
                    </div>
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-primary/30 transition-colors">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <Wand2 size={18} className="text-purple-400" /> {t.about.pillars.edit.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.edit.desc}</p>
                    </div>
                    <div className="bg-surface border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-primary/30 transition-colors">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                            <ShieldCheck size={18} className="text-emerald-400" /> {t.about.pillars.privacy.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.about.pillars.privacy.desc}</p>
                    </div>
                </div>

                <div className="h-px bg-gray-800"></div>

                {/* Developer Info */}
                <div className="bg-surface border border-gray-800 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                        <Code size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-tr from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">J</div>
                            <div>
                                <h4 className="text-white font-bold">{t.about.dev.title}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">{t.about.dev.subtitle}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed italic">{t.about.dev.quote}</p>
                        <div className="flex gap-6 pt-4">
                             <a 
                                href="https://aicc.pro" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                             >
                                <Sparkles size={14} className="text-amber-400" /> AI 知识共创 <ExternalLink size={10} />
                             </a>
                             <a 
                                href="https://uxlib.net" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                             >
                                <Layout size={14} className="text-blue-400" /> UX Lib <ExternalLink size={10} />
                             </a>
                        </div>
                    </div>
                </div>

                {/* Support Section */}
                <div className="bg-surface border border-gray-800 p-10 rounded-3xl text-center space-y-6 relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-6 p-4 bg-red-500/10 rounded-full text-red-500 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            <Heart size={32} fill="currentColor" />
                        </div>
                        
                        <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                            请我喝红牛 <Zap size={24} className="text-amber-400 fill-amber-400" />
                        </h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                            如果你觉得这个小工具对你有帮助，欢迎请 jovi 喝罐红牛，鼓励开发者持续迭代更多有趣的功能！
                        </p>
                        
                        <div className="mt-8 relative group/qr">
                            <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-purple-600/30 rounded-full opacity-0 group-hover/qr:opacity-100 blur-2xl transition-all duration-700 scale-75 group-hover/qr:scale-110"></div>
                            
                            <div className="relative bg-white p-3 rounded-2xl shadow-2xl transition-all duration-500 group-hover/qr:scale-105 group-hover/qr:rotate-1 group-hover/qr:shadow-primary/20">
                                {!imgError ? (
                                    <img 
                                        src="/coffee.png"
                                        alt="Support QR Code" 
                                        className="w-40 h-40 md:w-48 md:h-48 rounded-xl object-contain block"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="w-40 h-40 md:w-48 md:h-48 flex flex-col items-center justify-center bg-gray-100 text-gray-400 rounded-xl">
                                        <ImageIcon size={48} className="mb-2 opacity-20" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">QR Code Loading Error</span>
                                        <span className="text-[8px] text-gray-400 mt-1 uppercase opacity-50">Please check "coffee.png" in root</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Support jovi
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutView;
