import React, { useState } from 'react';
import { Page } from '../types';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check
} from 'lucide-react';
import { getPageDimensionsMm } from '../utils/imageProcessing';

interface PagesSidebarProps {
  pages: Page[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onRenamePage: (index: number, newName: string) => void;
}

export const PagesSidebar: React.FC<PagesSidebarProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onRenamePage,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const startRename = (index: number, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const saveRename = (index: number) => {
    if (editingName.trim()) {
      onRenamePage(index, editingName.trim());
    }
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c20] text-neutral-300 select-none">
      {/* Header bar */}
      <div className="p-2.5 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-200">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Pages ({pages.length})</span>
        </div>
        <button
          onClick={onAddPage}
          title="Add New A4 Page"
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded text-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Page</span>
        </button>
      </div>

      {/* Pages list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pages.map((page, index) => {
          const isActive = index === activePageIndex;
          const dims = getPageDimensionsMm(page);
          const isLandscape = page.orientation === 'landscape';

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(index)}
              className={`group rounded-lg border p-2 cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              {/* Page Title & actions */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[11px] font-mono font-bold text-neutral-400">
                    {index + 1}.
                  </span>
                  {editingIndex === index ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(index);
                          if (e.key === 'Escape') setEditingIndex(null);
                        }}
                        autoFocus
                        className="bg-neutral-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                      />
                      <button
                        onClick={() => saveRename(index)}
                        className="p-1 text-emerald-400 hover:text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onDoubleClick={(e) => startRename(index, page.name, e)}
                      className={`text-xs font-medium truncate ${
                        isActive ? 'text-blue-200' : 'text-neutral-200'
                      }`}
                    >
                      {page.name}
                    </span>
                  )}
                </div>

                {/* Quick actions on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(index, index - 1);
                    }}
                    title="Move Up"
                    className="p-1 hover:text-white text-neutral-400 disabled:opacity-20"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === pages.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(index, index + 1);
                    }}
                    title="Move Down"
                    className="p-1 hover:text-white text-neutral-400 disabled:opacity-20"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(index);
                    }}
                    title="Duplicate Page"
                    className="p-1 hover:text-white text-neutral-400"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    disabled={pages.length <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${page.name}?`)) {
                        onDeletePage(index);
                      }
                    }}
                    title="Delete Page"
                    className="p-1 hover:text-red-400 text-neutral-400 disabled:opacity-20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Page Mini Thumbnail Canvas Preview */}
              <div className="flex items-center justify-center bg-neutral-950/60 rounded p-1.5 border border-neutral-850">
                <div
                  className={`bg-white rounded-sm shadow relative overflow-hidden border border-neutral-300 flex items-center justify-center ${
                    isLandscape ? 'w-24 h-16' : 'w-16 h-24'
                  }`}
                >
                  {page.layers.length === 0 ? (
                    <span className="text-[9px] text-neutral-400 select-none">Empty</span>
                  ) : (
                    page.layers.map((layer) => {
                      if (!layer.visible) return null;
                      const pageW = dims.widthMm;
                      const pageH = dims.heightMm;
                      const leftPct = (layer.x / pageW) * 100;
                      const topPct = (layer.y / pageH) * 100;
                      const widthPct = (layer.width / pageW) * 100;
                      const heightPct = (layer.height / pageH) * 100;

                      return (
                        <div
                          key={layer.id}
                          className="absolute border border-blue-400/50 bg-blue-100/30 overflow-hidden"
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                          }}
                        >
                          <img
                            src={layer.src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Page metadata footer */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400">
                <span>
                  {page.paperSize} ({page.orientation === 'portrait' ? 'P' : 'L'})
                </span>
                <span>
                  {page.layers.length} {page.layers.length === 1 ? 'layer' : 'layers'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
