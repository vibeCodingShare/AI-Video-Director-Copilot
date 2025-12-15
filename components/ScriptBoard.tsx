import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import SceneCard from './SceneCard';
import { SceneType, Scene } from '../types';
import { SCENE_TYPE_LABELS, SCENE_TYPE_COLORS } from '../constants';
import { Filter, Download, AlertTriangle } from 'lucide-react';

const ScriptBoard: React.FC = () => {
  const { getCurrentProject, updateScene, storageError } = useAppStore();
  const project = getCurrentProject();
  const [filterType, setFilterType] = useState<SceneType | 'ALL'>('ALL');

  if (!project || !project.data) return null;

  const scenes = project.data.scenes;
  const filteredScenes = useMemo(() => {
    if (filterType === 'ALL') return scenes;
    return scenes.filter(s => s.type === filterType);
  }, [scenes, filterType]);

  const handleSceneUpdate = (updatedFields: Partial<Scene> & { id: number }) => {
    if (!project) return;
    updateScene(project.id, updatedFields.id, updatedFields);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${project.title.replace(/\s+/g, '_')}_script.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Storage Warning */}
      {storageError && (
        <div className="mb-4 bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3 text-red-200 text-sm">
            <AlertTriangle className="shrink-0 text-red-500" size={18} />
            <div>
                <span className="font-bold">Storage Warning:</span> {storageError}
            </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{project.title}</h2>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl truncate">{project.data.project_summary}</p>
        </div>
        <button 
          onClick={exportJSON}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-1.5 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Download size={14} /> Export JSON
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <div className="text-gray-500 mr-2 flex items-center gap-1">
          <Filter size={16} /> Filter:
        </div>
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterType === 'ALL' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
        >
          All Scenes
        </button>
        {Object.values(SceneType).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterType === type 
                ? SCENE_TYPE_COLORS[type] 
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
          >
            {SCENE_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {filteredScenes.map(scene => (
          <div key={scene.id} className="min-h-[400px]">
            <SceneCard scene={scene} onUpdate={handleSceneUpdate} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptBoard;
