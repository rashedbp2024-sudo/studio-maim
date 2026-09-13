import React, { useState } from 'react';
import { DocumentLayer } from '../types';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Check,
  Edit2
} from 'lucide-react';

interface LayersSidebarProps {
  layers: DocumentLayer[];
  selectedLayerIds: string[];
  onSelectLayer: (id: string, isMulti: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, newName: string) => void;
  onDeleteLayer: (id: string) => void;
  onReorderLayer: (id: string, action: 'up' | 'down' | 'top' | 'bottom') => void;
}

export const LayersSidebar: React.FC<LayersSidebarProps> = ({
  layers,
  selectedLayerIds,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
  onDeleteLayer,
  onReorderLayer,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const startRename = (layer: DocumentLayer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameLayer(id, editingName.trim());
    }
    setEditingId(null);
  };

  // Layers are rendered in stack order: top-most layer is last in array (rendered on top),
  // but in desktop layers panels (Photoshop, InDesign, Illustrator), the top layer is shown at the top of the list!
  // So we reverse for display:
  const displayLayers = [...layers].reverse();

  return (
    <div className="flex flex-col h-full bg-[#1c1c20] text-neutral-300 select-none">
      {/* Header bar */}
      <div className="p-2.5 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-200">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Layers ({layers.length})</span>
        </div>
        <span className="text-[10px] text-neutral-500">Independent Objects</span>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {layers.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            No document layers on this page. Import an image or use the Quick Setup wizard to start.
          </div>
        ) : (
          displayLayers.map((layer) => {
            const isSelected = selectedLayerIds.includes(layer.id);

            return (
              <div
                key={layer.id}
                onClick={(e) => onSelectLayer(layer.id, e.shiftKey || e.ctrlKey)}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-900/40 border-blue-500 text-white shadow-sm'
                    : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Visibility Eye button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  className={`p-1 rounded hover:text-white ${
                    layer.visible ? 'text-neutral-400' : 'text-neutral-600'
                  }`}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Lock Padlock button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  className={`p-1 rounded hover:text-white ${
                    layer.locked ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {layer.locked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Layer Thumbnail */}
                <div className="w-7 h-7 rounded bg-black/40 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={layer.src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Layer Name & Quick info */}
                <div className="flex-1 min-w-0">
                  {editingId === layer.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(layer.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="bg-neutral-900 border border-blue-500 rounded px-1 py-0.5 text-xs text-white outline-none w-full"
                      />
                      <button
                        onClick={() => saveRename(layer.id)}
                        className="p-1 text-emerald-400 hover:text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={(e) => startRename(layer, e)}
                      className="flex flex-col"
                    >
                      <span className="font-medium truncate">{layer.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {Math.round(layer.width)}×{Math.round(layer.height)}mm
                      </span>
                    </div>
                  )}
                </div>

                {/* Layer Reorder / Delete Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderLayer(layer.id, 'top');
                    }}
                    title="Bring to Front"
                    className="p-1 hover:text-white text-neutral-400"
                  >
                    <ArrowUpToLine className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderLayer(layer.id, 'up');
                    }}
                    title="Bring Forward"
                    className="p-1 hover:text-white text-neutral-400"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderLayer(layer.id, 'down');
                    }}
                    title="Send Backward"
                    className="p-1 hover:text-white text-neutral-400"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderLayer(layer.id, 'bottom');
                    }}
                    title="Send to Back"
                    className="p-1 hover:text-white text-neutral-400"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    title="Delete Layer"
                    className="p-1 hover:text-red-400 text-neutral-400 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
