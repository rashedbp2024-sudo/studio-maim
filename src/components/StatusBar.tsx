import React from 'react';
import { Page, DocumentLayer } from '../types';
import {
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize,
  HardDrive
} from 'lucide-react';
import { getPageDimensionsMm } from '../utils/imageProcessing';

interface StatusBarProps {
  page: Page;
  pageIndex: number;
  totalPages: number;
  selectedLayers: DocumentLayer[];
  zoom: number;
  onZoomChange: (z: number) => void;
  onZoomFit: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  page,
  pageIndex,
  totalPages,
  selectedLayers,
  zoom,
  onZoomChange,
  onZoomFit,
}) => {
  const pageDims = getPageDimensionsMm(page);
  const primaryLayer = selectedLayers[0] || null;

  return (
    <div className="h-6 bg-[#18181b] border-t border-neutral-800 flex items-center justify-between px-3 text-[11px] text-neutral-400 select-none shrink-0 font-sans">
      {/* Left side: Page info & Layer Selection status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-neutral-300">
          <span>
            Page {pageIndex + 1} of {totalPages}:
          </span>
          <span className="text-white font-semibold truncate max-w-[150px]">{page.name}</span>
          <span className="text-neutral-500 font-mono">
            ({page.paperSize}, {pageDims.widthMm} × {pageDims.heightMm} mm)
          </span>
        </div>

        {primaryLayer ? (
          <div className="flex items-center gap-2 border-l border-neutral-800 pl-3 font-mono text-neutral-300">
            <span className="text-blue-400 font-sans font-medium">{primaryLayer.name}:</span>
            <span>
              X: {Math.round(primaryLayer.x * 10) / 10}mm
            </span>
            <span>
              Y: {Math.round(primaryLayer.y * 10) / 10}mm
            </span>
            <span>
              W: {Math.round(primaryLayer.width * 10) / 10}mm
            </span>
            <span>
              H: {Math.round(primaryLayer.height * 10) / 10}mm
            </span>
            {selectedLayers.length > 1 && (
              <span className="text-purple-400 font-sans">
                (+{selectedLayers.length - 1} other layers selected)
              </span>
            )}
          </div>
        ) : (
          <div className="border-l border-neutral-800 pl-3 text-neutral-500 hidden sm:block">
            No layer selected (Click document photo to inspect)
          </div>
        )}
      </div>

      {/* Right side: Security badge & Zoom Controls */}
      <div className="flex items-center gap-4">
        {/* Offline Privacy / Local Processing Status */}
        <div className="flex items-center gap-1.5 text-emerald-400/90 text-[10px] hidden md:flex" title="All processing occurs locally in memory on your desktop PC. Customer photos are never uploaded to any external cloud.">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local PC Memory Only • 100% Confidential</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-l border-neutral-800 pl-3">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            title="Zoom Out (Ctrl + -)"
            className="p-0.5 hover:text-white rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span
            onClick={onZoomFit}
            title="Click to Reset Zoom (100%)"
            className="font-mono text-neutral-300 hover:text-white cursor-pointer px-1 w-11 text-center"
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => onZoomChange(Math.min(3.0, zoom + 0.1))}
            title="Zoom In (Ctrl + +)"
            className="p-0.5 hover:text-white rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onZoomFit}
            title="Fit to Window"
            className="p-0.5 hover:text-white rounded ml-1"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
