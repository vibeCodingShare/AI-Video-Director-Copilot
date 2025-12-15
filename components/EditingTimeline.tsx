
import React from 'react';
import { useAppStore } from '../store/AppContext';
import { SCENE_TYPE_COLORS, SCENE_TYPE_LABELS } from '../constants';
import { Wand2, Scissors, Music, ArrowRightLeft, Timer, Flame, Film, Zap, Layers, Play } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const EditingTimeline: React.FC = () => {
  const { getCurrentProject, taskState, startEditPlanGeneration } = useAppStore();
  const project = getCurrentProject();
  
  if (!project || !project.data) {
    return <div className="text-center text-gray-500 mt-20">Please generate a script first.</div>;
  }

  // Check global state
  const isGenerating = taskState.generatingEditPlanIds.has(project.id);

  const handleGeneratePlan = () => {
     startEditPlanGeneration(project.id);
  };

  const plan = project.editingPlan;
  const scenes = project.data.scenes;

  // Calculate cumulative timeline for the vertical display
  let currentTimeCursor = 0;
  const timelineItems = plan?.timeline.map((item) => {
      const start = currentTimeCursor;
      const end = currentTimeCursor + item.newDuration;
      currentTimeCursor = end;
      return { ...item, startTime: start, endTime: end };
  }) || [];

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Film className="text-accent" /> Viral Edit Copilot
            </h2>
            <p className="text-xs text-gray-400 mt-1">AI Director re-sequences your footage for maximum retention.</p>
        </div>
        
        {!plan && (
             <button
             onClick={handleGeneratePlan}
             disabled={isGenerating}
             className="bg-accent hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
           >
             {isGenerating ? <Zap className="animate-pulse" /> : <Scissors />}
             {isGenerating ? 'Analyzing Footage...' : 'Generate Viral Cut'}
           </button>
        )}
        {plan && (
             <button
             onClick={handleGeneratePlan}
             disabled={isGenerating}
             className="text-xs text-gray-400 hover:text-white flex items-center gap-1 disabled:opacity-50 border border-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
           >
             <Wand2 size={12} className={isGenerating ? "animate-pulse" : ""}/> 
             {isGenerating ? 'Remixing...' : 'Regenerate Edit'}
           </button>
        )}
      </div>

      {/* Loading State - New Animation */}
      {!plan && !isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface rounded-xl border border-gray-800 p-12 text-center min-h-[400px]">
            <div className="bg-gray-900 p-8 rounded-full mb-6 relative group">
                <div className="absolute inset-0 bg-accent/10 rounded-full scale-100 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <Scissors size={48} className="text-gray-500 relative z-10 group-hover:text-accent transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Ready to Cut?</h3>
            <p className="text-gray-400 max-w-md leading-relaxed">
                The AI Editor will analyze your script logic to:
                <br/>
                <span className="flex items-center justify-center gap-2 mt-3 text-sm">
                    <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800">Reorder Hooks</span>
                    <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded border border-amber-800">Trim Fluff</span>
                    <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-800">Add J-Cuts</span>
                </span>
            </p>
        </div>
      ) : isGenerating && !plan ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface rounded-xl border border-gray-800 p-12 text-center min-h-[400px]">
            <div className="relative mb-8">
                {/* CSS3 Pulse Animation */}
                <div className="absolute inset-0 bg-accent/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="relative bg-surface border-2 border-accent p-6 rounded-full shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]">
                    <Scissors size={40} className="text-accent animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Director is Editing...</h3>
            <p className="text-sm text-gray-500 animate-pulse">Analyzing pacing, identifying hooks, and slicing timeline.</p>
        </div>
      ) : (
        <div className={`space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* 1. Strategy Card */}
            <div className="bg-gradient-to-r from-surface to-black border border-gray-700 p-6 rounded-xl relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Flame size={150} />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 relative z-10 gap-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <Music size={16} className="text-accent" /> Editing Strategy
                    </h3>
                    <div className="flex items-center gap-3">
                         <div className="text-right">
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Total Time</div>
                            <div className="text-white font-mono font-bold">{formatTime(plan?.total_duration || 0)}</div>
                         </div>
                         <div className="w-px h-8 bg-gray-700"></div>
                         <div className="text-right">
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Viral Score</div>
                            <div className={`text-xl font-black ${
                                (plan?.viral_score_prediction || 0) >= 8 ? 'text-green-400' : 
                                (plan?.viral_score_prediction || 0) >= 5 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                                {plan?.viral_score_prediction || '?'}/10
                            </div>
                         </div>
                    </div>
                </div>
                <p className="text-base text-gray-200 leading-relaxed italic border-l-2 border-accent/30 pl-4 relative z-10">
                    "{plan?.pacing_notes}"
                </p>
            </div>

            {/* 2. Vertical Timeline */}
            <div className="relative">
                {/* The vertical line */}
                <div className="absolute left-[4.5rem] md:left-[5.5rem] top-4 bottom-4 w-px bg-gray-800"></div>

                <div className="space-y-6">
                    {timelineItems.map((item, index) => {
                        const scene = scenes.find(s => s.id === item.sceneId);
                        const action = item.action || 'KEEP';
                        const isHook = action === 'MOVE_TO_START';
                        const isTrimmed = item.newDuration < item.originalDuration;
                        const isReordered = action === 'REORDER';
                        
                        // Determine card style based on action
                        let actionColor = 'border-gray-800 bg-surface';
                        let actionIcon = null;

                        if (isHook) {
                            actionColor = 'border-red-900/50 bg-red-900/10';
                            actionIcon = <Flame size={12} className="text-red-500" />;
                        } else if (isReordered) {
                            actionColor = 'border-blue-900/50 bg-blue-900/10';
                            actionIcon = <ArrowRightLeft size={12} className="text-blue-500" />;
                        } else if (isTrimmed) {
                            actionColor = 'border-amber-900/50 bg-amber-900/10';
                            actionIcon = <Scissors size={12} className="text-amber-500" />;
                        }

                        // Scene Type Color Indicator
                        const typeColorClass = scene ? SCENE_TYPE_COLORS[scene.type] : 'bg-gray-700';

                        return (
                            <div key={`${item.sceneId}-${index}`} className="relative flex group">
                                {/* Left Column: Time */}
                                <div className="w-[4.5rem] md:w-[5.5rem] shrink-0 text-right pr-4 pt-4 flex flex-col items-end">
                                    <span className="text-xs font-mono font-bold text-gray-400">{formatTime(item.startTime)}</span>
                                    <span className="text-[10px] text-gray-600 font-mono">+{item.newDuration}s</span>
                                </div>

                                {/* Center: Node */}
                                <div className="relative z-10 pt-4 flex flex-col items-center mr-4 md:mr-6">
                                    <div className={`w-3 h-3 rounded-full border-2 border-background ${isHook ? 'bg-red-500' : 'bg-gray-600'} shadow-sm`}></div>
                                </div>

                                {/* Right Column: Card */}
                                <div className={`flex-1 rounded-xl border p-4 transition-all hover:border-gray-600 ${actionColor}`}>
                                    {/* Card Header: Badges & Type */}
                                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${typeColorClass.replace('bg-', 'bg-').replace('border-', 'border-transparent ')}`}>
                                            {scene ? SCENE_TYPE_LABELS[scene.type].split(' ')[0] : 'Scene'}
                                        </div>

                                        {action !== 'KEEP' && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded border border-white/10 text-gray-300">
                                                {actionIcon}
                                                {action.replace(/_/g, ' ')}
                                                {isTrimmed && <span className="text-amber-500 ml-1">(-{(item.originalDuration - item.newDuration).toFixed(1)}s)</span>}
                                            </div>
                                        )}
                                        
                                        <div className="ml-auto text-[10px] text-gray-500 font-mono">
                                            Source Scene #{item.sceneId}
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex gap-4">
                                        {/* Thumbnail / Visual Placeholder */}
                                        <div className="hidden sm:flex shrink-0 w-24 h-16 bg-black/50 rounded-lg border border-white/5 items-center justify-center overflow-hidden relative">
                                             {scene?.generated_image_url ? (
                                                 <img src={scene.generated_image_url} className="w-full h-full object-cover opacity-60" alt="" />
                                             ) : (
                                                 <Layers className="text-gray-700" />
                                             )}
                                             <div className="absolute inset-0 flex items-center justify-center">
                                                 <Play size={16} className="text-white/20 fill-white/20" />
                                             </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-200 line-clamp-3 mb-2 leading-relaxed">
                                                <span className="text-gray-500 mr-2">Audio/Script:</span>
                                                "{scene?.script}"
                                            </p>
                                            
                                            {/* Visual Spec Snippet */}
                                            {scene?.visual_spec && (
                                                <p className="text-xs text-gray-500 mb-3 flex items-start gap-1">
                                                    <Film size={10} className="mt-0.5 shrink-0" />
                                                    <span className="italic">{scene.visual_spec.description}</span>
                                                </p>
                                            )}

                                            {/* Reasoning Box */}
                                            <div className="bg-black/30 rounded p-2 text-xs flex gap-2 border-l-2 border-gray-600">
                                                <Zap size={12} className="text-accent shrink-0 mt-0.5" />
                                                <span className="text-gray-400 italic">
                                                    <span className="text-accent font-bold not-italic">Editor's Note: </span> 
                                                    {item.reason}
                                                </span>
                                            </div>

                                            {/* J-Cut Indicator */}
                                            {item.audioOverlay && (
                                                <div className="mt-2 text-[10px] text-purple-400 flex items-center gap-1 bg-purple-900/10 px-2 py-1 rounded inline-block">
                                                    <Music size={10} /> J-Cut: {item.audioOverlay}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transition Pill (Bottom Edge) */}
                                    {index < timelineItems.length - 1 && (
                                        <div className="absolute -bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                                            <div className="bg-gray-900 border border-gray-700 text-gray-500 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                                                {item.transition}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* End Marker */}
                <div className="flex items-center mt-6 ml-[4.5rem] md:ml-[5.5rem]">
                    <div className="w-2 h-2 rounded-full bg-gray-700 mr-4 md:mr-6 -ml-1"></div>
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">End of Timeline</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EditingTimeline;
