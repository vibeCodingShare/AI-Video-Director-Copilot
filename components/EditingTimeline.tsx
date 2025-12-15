import React, { useState } from 'react';
import { Project, EditingPlan } from '../types';
import { useAppStore } from '../store/AppContext';
import { generateEditingPlan } from '../services/gemini';
import { buildEditingPlanPrompt } from '../utils/promptBuilder';
import { SCENE_TYPE_COLORS } from '../constants';
import { PlayCircle, Wand2, Scissors, Music } from 'lucide-react';

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
      // Create a lightweight version of scenes without the large base64 image data
      // This prevents the prompt from exceeding token limits or payload size limits
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
            <Scissors className="text-accent" /> Editing Assistant
        </h2>
        {!plan && (
             <button
             onClick={handleGeneratePlan}
             disabled={loading}
             className="bg-accent hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all"
           >
             {loading ? <Wand2 className="animate-spin" /> : <Wand2 />}
             Generate Editing Plan
           </button>
        )}
      </div>

      {!plan ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface rounded-xl border border-gray-800 p-12 text-center">
            <div className="bg-gray-900 p-6 rounded-full mb-6">
                <Scissors size={48} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No Plan Yet</h3>
            <p className="text-gray-400 max-w-md">
                Ask the AI to analyze your script specifically for pacing, rhythm, and transitions. 
                It will visualize the flow of your video.
            </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Pacing Notes */}
            <div className="bg-surface border border-gray-700 p-6 rounded-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <Music size={16} /> Director's Pacing Notes
                </h3>
                <p className="text-lg text-gray-200 leading-relaxed italic">
                    "{plan.pacing_notes}"
                </p>
            </div>

            {/* Visual Timeline */}
            <div className="bg-black/40 border border-gray-800 p-8 rounded-xl overflow-x-auto">
                <div className="flex items-center min-w-max pb-8">
                    {plan.timeline.map((item, index) => {
                        const scene = scenes.find(s => s.id === item.sceneId);
                        if (!scene) return null;
                        
                        // Calculate width based on duration (min 80px, max 300px scale)
                        const width = Math.max(100, Math.min(scene.duration_sec * 20, 400));
                        const colorClass = SCENE_TYPE_COLORS[scene.type] || 'bg-gray-700';

                        return (
                            <div key={item.sceneId} className="flex items-center">
                                {/* Scene Block */}
                                <div 
                                    className="relative group flex flex-col"
                                    style={{ width: `${width}px` }}
                                >
                                    {/* Duration Indicator */}
                                    <div className="text-center text-xs text-gray-500 mb-2 font-mono">
                                        {scene.duration_sec}s
                                    </div>

                                    {/* The Block */}
                                    <div 
                                        className={`h-24 rounded-lg border border-white/10 ${colorClass} flex items-center justify-center relative shadow-lg transition-transform group-hover:-translate-y-1`}
                                    >
                                        <span className="font-bold text-2xl opacity-20">#{index + 1}</span>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                                            <span className="text-xs text-white px-2 text-center font-medium">
                                                {scene.visual_spec.shot_size}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Scene Detail Popover (Simple text below) */}
                                    <div className="mt-3 text-xs text-gray-400 px-1 truncate">
                                        {scene.script.substring(0, 30)}...
                                    </div>
                                </div>

                                {/* Transition Connector */}
                                {index < plan.timeline.length - 1 && (
                                    <div className="flex flex-col items-center mx-2 w-24 relative z-10">
                                        <div className="h-[1px] w-full bg-gray-600 absolute top-12 -z-10"></div>
                                        <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-[10px] uppercase text-accent font-bold shadow-sm whitespace-nowrap">
                                            {item.transition}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {plan.timeline.map((item, idx) => (
                      <div key={idx} className="bg-surface border border-gray-800 p-4 rounded-lg flex items-start gap-3">
                          <div className="bg-gray-800 text-gray-400 font-bold w-8 h-8 rounded flex items-center justify-center shrink-0">
                              {idx + 1}
                          </div>
                          <div>
                              <div className="text-xs uppercase text-gray-500 font-bold mb-1">
                                  {item.transition} • {item.duration}s
                              </div>
                              <p className="text-sm text-gray-300">{item.notes}</p>
                          </div>
                      </div>
                 ))}
             </div>
        </div>
      )}
    </div>
  );
};

export default EditingTimeline;
