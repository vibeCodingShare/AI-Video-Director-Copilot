
import React, { useState } from 'react';
import { Scene } from '../types';
import { SCENE_TYPE_COLORS, SCENE_TYPE_LABELS } from '../constants';
import { Image as ImageIcon, RefreshCw, Clock, Camera, Film, Lightbulb, Zap, Palette, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/AppContext';

interface SceneCardProps {
  scene: Scene;
  onUpdate: (updatedFields: Partial<Scene> & { id: number }) => void;
  onDelete: (id: number) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onUpdate, onDelete }) => {
  const { settings, taskState, startSceneImageGeneration, currentProjectId } = useAppStore();
  
  // Default to first template or a blank string
  const [selectedStyleId, setSelectedStyleId] = useState<string>(
      scene.image_style_preset || settings.imageStyleTemplates[0]?.id || ''
  );

  // Check global state
  const isGenerating = currentProjectId ? taskState.generatingImageIds.has(`${currentProjectId}-${scene.id}`) : false;

  const handleGenerateImage = async () => {
    if (currentProjectId) {
        startSceneImageGeneration(currentProjectId, scene, selectedStyleId);
    }
  };

  const badgeColor = SCENE_TYPE_COLORS[scene.type] || 'bg-gray-800 border-gray-700 text-gray-300';

  return (
    <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-300 flex flex-col h-full group/card">
      {/* Header */}
      <div className={`px-4 py-2 flex justify-between items-center text-xs font-semibold uppercase tracking-wider border-b border-black/20 ${badgeColor}`}>
        <div className="flex items-center gap-2 truncate mr-2">
            <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-90 border border-white/10">#{scene.id}</span>
            <span className="truncate">{SCENE_TYPE_LABELS[scene.type]}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-80">
            <Clock size={12} />
            {scene.duration_sec}s
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(scene.id);
            }}
            className="opacity-60 hover:opacity-100 hover:text-red-200 transition-opacity p-1 -mr-1 rounded"
            title="Delete Scene"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-grow">
        {/* Script & Emotion */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {scene.emotion || 'Neutral'}
            </span>
          </div>
          <p className="text-lg text-white font-medium leading-relaxed">
            "{scene.script}"
          </p>
        </div>

        {/* Visual Specs */}
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 bg-black/30 p-3 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2">
            <Camera size={14} className="text-primary" />
            <span>{scene.visual_spec.shot_size}</span>
          </div>
          <div className="flex items-center gap-2">
            <Film size={14} className="text-primary" />
            <span>{scene.visual_spec.camera_move}</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-primary" />
            <span>{scene.visual_spec.lighting}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 text-gray-300 italic">
             {scene.visual_spec.description}
          </div>
        </div>
      
        {/* Image Section */}
        <div className="mt-auto space-y-2">
          {/* Style Selector - Always visible */}
          <div className="flex items-center gap-2">
             <Palette size={14} className="text-gray-500" />
             <select 
              value={selectedStyleId}
              onChange={(e) => setSelectedStyleId(e.target.value)}
              className="bg-black/40 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 w-full focus:outline-none focus:border-primary"
             >
                 {settings.imageStyleTemplates.map(t => (
                     <option key={t.id} value={t.id}>{t.name}</option>
                 ))}
             </select>
          </div>

          {scene.generated_image_url ? (
            <div className="relative group rounded-lg overflow-hidden border border-gray-700 aspect-video bg-black">
              <img 
                src={scene.generated_image_url} 
                alt="Storyboard" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <button 
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="absolute bottom-2 right-2 p-2 bg-black/70 hover:bg-black rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                title="Regenerate"
              >
                <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="w-full py-6 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-white hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2 group"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={24} className="animate-spin text-primary" />
                  <span className="text-sm">Generating...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Generate Visual</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Editing Note */}
        {scene.editing_note && (
          <div className="mt-2 text-xs text-amber-500 flex items-start gap-2 bg-amber-900/10 p-2 rounded">
            <Zap size={12} className="mt-0.5 shrink-0" />
            {scene.editing_note}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneCard;
