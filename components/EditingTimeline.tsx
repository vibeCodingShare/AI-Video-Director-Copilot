
import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { generateEditingPlan } from '../services/gemini';
import { buildEditingPlanPrompt } from '../utils/promptBuilder';
import { SCENE_TYPE_COLORS } from '../constants';
import { PlayCircle, Wand2, Scissors, Music, Zap, ArrowRightLeft, Timer, Flame, AlertCircle } from 'lucide-react';

const EditingTimeline: React.FC = () => {
  const { getCurrentProject, updateProject, settings } = useAppStore();
  const project = getCurrentProject();
  const [loading, setLoading] = useState(false);

  if (!project || !project.data) {
    return <div className="text-center text-gray-500 mt-20">Please generate a script first.</div>;
  }

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const cleanScenes = project.data?.scenes.map(({ generated_image_url, ...rest }) => rest);
      const cleanProjectData = { ...project.data, scenes: cleanScenes };

      const prompt = buildEditingPlanPrompt(cleanProjectData);
      const plan = await generateEditingPlan(prompt, settings);
      updateProject(project.id, { editingPlan: plan });
    } catch (e) {
      console.error(e);
      alert("Failed to generate editing plan. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const plan = project.editingPlan;
  const scenes = project.data.scenes;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scissors className="text-accent" /> Viral Edit Copilot
        </h2>
        {!plan && (
             <button
             onClick={handleGeneratePlan}
             disabled={loading}
             className="bg-accent hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all"
           >
             {loading ? <Wand2 className="animate-spin" /> : <Flame />}
             Generate Viral Cut
           </button>
        )}
        {plan && (
             <button
             onClick={handleGeneratePlan}
             disabled={loading}
             className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
           >
             <Wand2 size={12}/> Regenerate
           </button>
        )}
      </div>

      {!plan ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface rounded-xl border border-gray-800 p-12 text-center">
            <div className="bg-gray-900 p-6 rounded-full mb-6 relative group">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Scissors size={48} className="text-gray-600 relative z-10" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Ready to Cut?</h3>
            <p className="text-gray-400 max-w-md">
                The AI Editor will reorder scenes, trim boring parts, and add J-Cuts to maximize audience retention. 
                <br/><span className="text-accent text-sm mt-2 inline-block">Warning: This is not a linear assembly.</span>
            </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Pacing Notes */}
            <div className="bg-surface border border-gray-700 p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Flame size={120} />
                </div>
                <div className="flex justify-between items-start mb-3 relative z-10">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Music size={16} /> Director's Strategy
                    </h3>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-gray-700">
                        <span className="text-gray-400 text-xs uppercase font-bold">Viral Score</span>
                        <span className="text-accent font-bold">{plan.viral_score_prediction || 'N/A'}/10</span>
                    </div>
                </div>
                <p className="text-lg text-gray-200 leading-relaxed italic relative z-10">
                    "{plan.pacing_notes}"
                </p>
            </div>

            {/* Visual Timeline */}
            <div>
                 <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <PlayCircle size={16} /> Final Timeline ({plan.total_duration}s)
                 </h4>
                <div className="bg-black/40 border border-gray-800 p-8 rounded-xl overflow-x-auto">
                    <div className="flex items-center min-w-max pb-4">
                        {plan.timeline.map((item, index) => {
                            const scene = scenes.find(s => s.id === item.sceneId);
                            if (!scene) return null;
                            
                            // Scale: 1s = 20px, clamped
                            const width = Math.max(100, Math.min(item.newDuration * 20, 400));
                            const colorClass = SCENE_TYPE_COLORS[scene.type] || 'bg-gray-700';

                            // Badges logic
                            const isHook = item.action === 'MOVE_TO_START';
                            const isTrimmed = item.newDuration < item.originalDuration;
                            const isMoved = item.action === 'REORDER';

                            return (
                                <div key={`${item.sceneId}-${index}`} className="flex items-center">
                                    {/* Scene Block */}
                                    <div 
                                        className="relative group flex flex-col"
                                        style={{ width: `${width}px` }}
                                    >
                                        {/* Indicators above block */}
                                        <div className="flex justify-center gap-1 mb-2 h-5">
                                            {isHook && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded flex items-center shadow-lg shadow-red-500/50">HOOK</span>}
                                            {isMoved && <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 rounded flex items-center"><ArrowRightLeft size={8} className="mr-1"/> MOVED</span>}
                                            {isTrimmed && <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded flex items-center"><Scissors size={8} className="mr-1"/> -{(item.originalDuration - item.newDuration).toFixed(1)}s</span>}
                                        </div>

                                        {/* The Block */}
                                        <div 
                                            className={`h-28 rounded-lg border border-white/10 ${colorClass} flex flex-col items-center justify-center relative shadow-lg transition-transform group-hover:-translate-y-1 overflow-hidden`}
                                        >
                                            {/* Striped pattern if trimmed to show intensity */}
                                            {isTrimmed && (
                                                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)'}}></div>
                                            )}

                                            <span className="font-bold text-2xl opacity-20">S{scene.id}</span>
                                            
                                            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                                 <span className="text-xs font-mono bg-black/30 px-1 rounded text-white/70">{item.newDuration}s</span>
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm p-2 text-center">
                                                <span className="text-xs text-white font-medium mb-1 line-clamp-2">
                                                    {scene.visual_spec.description}
                                                </span>
                                            </div>
                                        </div>

                                        {/* J-Cut Overlay Indicator */}
                                        {item.audioOverlay && (
                                            <div className="absolute -bottom-6 left-2 right-2 bg-purple-900/80 text-purple-200 text-[10px] px-2 py-1 rounded border border-purple-500/50 truncate">
                                                🎵 {item.audioOverlay}
                                            </div>
                                        )}
                                    </div>

                                    {/* Transition Connector */}
                                    {index < plan.timeline.length - 1 && (
                                        <div className="flex flex-col items-center mx-1 w-16 relative z-10 shrink-0">
                                            <div className="h-[2px] w-full bg-gray-700 absolute top-14 -z-10"></div>
                                            <div className="bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[9px] uppercase text-gray-400 font-bold shadow-sm whitespace-nowrap overflow-hidden max-w-full text-ellipsis" title={item.transition}>
                                                {item.transition}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Detailed Edit List */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {plan.timeline.map((item, idx) => {
                     const scene = scenes.find(s => s.id === item.sceneId);
                     return (
                      <div key={idx} className={`bg-surface border p-4 rounded-lg flex items-start gap-3 ${item.action !== 'KEEP' ? 'border-primary/30 bg-primary/5' : 'border-gray-800'}`}>
                          <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className="bg-gray-800 text-gray-400 font-bold w-6 h-6 rounded flex items-center justify-center text-xs">
                                  #{idx + 1}
                              </div>
                              <div className="text-[10px] text-gray-600 font-mono">
                                  Src:{item.sceneId}
                              </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <div className={`text-xs uppercase font-bold px-1.5 py-0.5 rounded ${
                                      item.action === 'KEEP' ? 'bg-gray-700 text-gray-300' : 
                                      item.action === 'TRIM' ? 'bg-amber-900 text-amber-300' :
                                      item.action === 'MOVE_TO_START' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                                  }`}>
                                      {item.action.replace(/_/g, ' ')}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-1">
                                      <Timer size={10} /> {item.newDuration}s
                                      {item.newDuration < item.originalDuration && (
                                          <span className="text-gray-600 line-through">({item.originalDuration}s)</span>
                                      )}
                                  </div>
                              </div>
                              
                              <p className="text-sm text-white mb-2 line-clamp-2">{scene?.script}</p>
                              
                              <div className="bg-black/30 p-2 rounded text-xs text-accent italic border-l-2 border-accent/50">
                                  " {item.reason} "
                              </div>
                          </div>
                      </div>
                 )})}
             </div>
        </div>
      )}
    </div>
  );
};

export default EditingTimeline;
