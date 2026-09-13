import React from 'react';
import { DocumentLayer, Page, PaperSize, Orientation, ID_CARD_DIMENSIONS } from '../types';
import {
  Sliders,
  Crop,
  SlidersHorizontal,
  RotateCw,
  RotateCcw,
  Lock,
  Unlock,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Maximize2,
  FileSpreadsheet
} from 'lucide-react';
import { calculateEffectiveDpi, getPageDimensionsMm } from '../utils/imageProcessing';

interface InspectorPanelProps {
  page: Page;
  selectedLayer: DocumentLayer | null;
  onUpdateLayer: (layerId: string, updates: Partial<DocumentLayer>) => void;
  onUpdatePage: (updates: Partial<Page>) => void;
  onCrop: () => void;
  onPerspective: () => void;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'centerPage') => void;
  onFitWidth: () => void;
  onFitPage: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  page,
  selectedLayer,
  onUpdateLayer,
  onUpdatePage,
  onCrop,
  onPerspective,
  onAlign,
  onFitWidth,
  onFitPage,
}) => {
  const pageDims = getPageDimensionsMm(page);

  // If no layer is selected, show Page Settings
  if (!selectedLayer) {
    return (
      <div className="flex flex-col h-full bg-[#1c1c20] text-neutral-300 select-none overflow-y-auto p-3 text-xs">
        <div className="border-b border-neutral-800 pb-2.5 mb-3">
          <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Page Setup</span>
          </div>
          <span className="text-[11px] text-neutral-500">
            {page.name} • {pageDims.widthMm} × {pageDims.heightMm} mm
          </span>
        </div>

        {/* Paper Size */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Paper Size
            </label>
            <select
              value={page.paperSize}
              onChange={(e) => onUpdatePage({ paperSize: e.target.value as PaperSize })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-200 outline-none focus:border-blue-500"
            >
              <option value="A4">A4 (210 × 297 mm) - Standard Print</option>
              <option value="A5">A5 (148 × 210 mm) - Half A4</option>
              <option value="A3">A3 (297 × 420 mm) - Large Print</option>
              <option value="Letter">US Letter (215.9 × 279.4 mm)</option>
              <option value="Legal">US Legal (215.9 × 355.6 mm)</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdatePage({ orientation: 'portrait' })}
                className={`py-1.5 px-3 rounded border text-center font-medium transition-colors ${
                  page.orientation === 'portrait'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-neutral-800/60 border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => onUpdatePage({ orientation: 'landscape' })}
                className={`py-1.5 px-3 rounded border text-center font-medium transition-colors ${
                  page.orientation === 'landscape'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-neutral-800/60 border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Page Background */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Paper Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={page.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer p-0"
              />
              <span className="font-mono text-neutral-400 uppercase">
                {page.backgroundColor || '#FFFFFF'} (White Recommended)
              </span>
            </div>
          </div>

          {/* Helper Notice */}
          <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 leading-relaxed mt-4">
            <p className="font-semibold text-neutral-200 mb-1">💡 Quick Operator Tip:</p>
            Click any document image on the canvas or in the Layers panel to inspect its exact millimeters, adjust brightness/contrast, crop, or correct perspective.
          </div>
        </div>
      </div>
    );
  }

  // Selected Layer Inspector
  const dpiInfo = calculateEffectiveDpi(selectedLayer);

  const handleWidthChange = (newWidthMm: number) => {
    if (isNaN(newWidthMm) || newWidthMm <= 1) return;
    if (selectedLayer.aspectRatioLocked && selectedLayer.width > 0) {
      const ratio = selectedLayer.height / selectedLayer.width;
      if (!isNaN(ratio) && ratio > 0) {
        onUpdateLayer(selectedLayer.id, {
          width: newWidthMm,
          height: Math.round(newWidthMm * ratio * 100) / 100,
        });
        return;
      }
    }
    onUpdateLayer(selectedLayer.id, { width: newWidthMm });
  };

  const handleHeightChange = (newHeightMm: number) => {
    if (isNaN(newHeightMm) || newHeightMm <= 1) return;
    if (selectedLayer.aspectRatioLocked && selectedLayer.height > 0) {
      const ratio = selectedLayer.width / selectedLayer.height;
      if (!isNaN(ratio) && ratio > 0) {
        onUpdateLayer(selectedLayer.id, {
          height: newHeightMm,
          width: Math.round(newHeightMm * ratio * 100) / 100,
        });
        return;
      }
    }
    onUpdateLayer(selectedLayer.id, { height: newHeightMm });
  };

  const handleAdjustmentChange = (key: string, val: any) => {
    const safeVal = typeof val === 'number' && isNaN(val) ? 0 : val;
    onUpdateLayer(selectedLayer.id, {
      adjustments: {
        ...(selectedLayer.adjustments || {}),
        [key]: safeVal,
      },
    });
  };

  const resetAdjustments = () => {
    onUpdateLayer(selectedLayer.id, {
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        exposure: 0,
        grayscale: false,
        blackAndWhite: false,
        bwThreshold: 128,
      },
    });
  };

  const applyNidStandardSize = () => {
    onUpdateLayer(selectedLayer.id, {
      width: ID_CARD_DIMENSIONS.widthMm,
      height: ID_CARD_DIMENSIONS.heightMm,
      aspectRatioLocked: true,
    });
  };

  const rotateBy = (deg: number) => {
    const next = (selectedLayer.rotation + deg) % 360;
    onUpdateLayer(selectedLayer.id, { rotation: next < 0 ? next + 360 : next });
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c20] text-neutral-300 select-none overflow-y-auto p-3 text-xs space-y-4">
      {/* Header: Layer Name & Quick Actions */}
      <div className="border-b border-neutral-800 pb-2.5">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={selectedLayer.name}
            onChange={(e) => onUpdateLayer(selectedLayer.id, { name: e.target.value })}
            className="font-semibold text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-blue-500 outline-none truncate"
          />
        </div>
        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
          Orig: {selectedLayer.originalWidth} × {selectedLayer.originalHeight} px
        </div>
      </div>

      {/* Physical Dimensions & Position (Millimeters) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-[11px] text-neutral-200">
            Physical Position & Size (mm)
          </span>
          <button
            onClick={() =>
              onUpdateLayer(selectedLayer.id, {
                aspectRatioLocked: !selectedLayer.aspectRatioLocked,
              })
            }
            title={selectedLayer.aspectRatioLocked ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
            className={`p-1 rounded flex items-center gap-1 text-[10px] transition-colors ${
              selectedLayer.aspectRatioLocked
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {selectedLayer.aspectRatioLocked ? (
              <Lock className="w-3 h-3 text-blue-400" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            <span>{selectedLayer.aspectRatioLocked ? 'Locked' : 'Free'}</span>
          </button>
        </div>

        {/* X, Y, W, H Inputs */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <span className="text-neutral-500 text-[10px] w-4">X:</span>
            <input
              type="number"
              step="0.5"
              value={typeof selectedLayer.x === 'number' && !isNaN(selectedLayer.x) ? Math.round(selectedLayer.x * 10) / 10 : 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onUpdateLayer(selectedLayer.id, { x: val });
              }}
              className="bg-transparent w-full text-neutral-200 outline-none text-xs"
            />
            <span className="text-neutral-600 text-[10px]">mm</span>
          </div>

          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <span className="text-neutral-500 text-[10px] w-4">Y:</span>
            <input
              type="number"
              step="0.5"
              value={typeof selectedLayer.y === 'number' && !isNaN(selectedLayer.y) ? Math.round(selectedLayer.y * 10) / 10 : 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onUpdateLayer(selectedLayer.id, { y: val });
              }}
              className="bg-transparent w-full text-neutral-200 outline-none text-xs"
            />
            <span className="text-neutral-600 text-[10px]">mm</span>
          </div>

          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <span className="text-neutral-500 text-[10px] w-4">W:</span>
            <input
              type="number"
              step="0.5"
              value={typeof selectedLayer.width === 'number' && !isNaN(selectedLayer.width) ? Math.round(selectedLayer.width * 10) / 10 : 10}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) handleWidthChange(val);
              }}
              className="bg-transparent w-full text-neutral-200 outline-none text-xs"
            />
            <span className="text-neutral-600 text-[10px]">mm</span>
          </div>

          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <span className="text-neutral-500 text-[10px] w-4">H:</span>
            <input
              type="number"
              step="0.5"
              value={typeof selectedLayer.height === 'number' && !isNaN(selectedLayer.height) ? Math.round(selectedLayer.height * 10) / 10 : 10}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) handleHeightChange(val);
              }}
              className="bg-transparent w-full text-neutral-200 outline-none text-xs"
            />
            <span className="text-neutral-600 text-[10px]">mm</span>
          </div>
        </div>

        {/* Quick Presets for Print Sizes */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={applyNidStandardSize}
            title="Set exact ISO standard ID card size (85.60 × 54.00 mm)"
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[10px] text-blue-300 font-medium transition-colors"
          >
            NID Card (85.6×54mm)
          </button>
          <button
            onClick={onFitWidth}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[10px] text-neutral-300 transition-colors"
          >
            Fit Width
          </button>
          <button
            onClick={onFitPage}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[10px] text-neutral-300 transition-colors"
          >
            Fit Page
          </button>
        </div>
      </div>

      {/* Rotation */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-[11px] text-neutral-200">Rotation</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => rotateBy(-90)}
              title="Rotate 90° CCW"
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => rotateBy(90)}
              title="Rotate 90° CW"
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="359"
            value={typeof selectedLayer.rotation === 'number' && !isNaN(selectedLayer.rotation) ? Math.round(selectedLayer.rotation) : 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onUpdateLayer(selectedLayer.id, { rotation: val });
            }}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-300 w-10 text-right">
            {typeof selectedLayer.rotation === 'number' && !isNaN(selectedLayer.rotation) ? Math.round(selectedLayer.rotation) : 0}°
          </span>
        </div>
      </div>

      {/* Resolution & Print Quality Meter */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-[11px] text-neutral-200">Effective Print Quality</span>
          <span
            className={`font-mono font-bold text-xs ${
              dpiInfo.dpi >= 300
                ? 'text-emerald-400'
                : dpiInfo.dpi >= 200
                ? 'text-blue-400'
                : 'text-amber-400'
            }`}
          >
            {dpiInfo.dpi} DPI
          </span>
        </div>

        {dpiInfo.warning ? (
          <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[10px] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Image resolution may be too low for high-quality printing (recommended 300 DPI).</span>
          </div>
        ) : (
          <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[10px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>High-resolution crisp quality for print shop printing.</span>
          </div>
        )}
      </div>

      {/* Primary Correction Tools: Crop & Perspective Straightener */}
      <div className="pt-2 border-t border-neutral-800 space-y-2">
        <span className="font-semibold text-[11px] text-neutral-200 block">
          Document Photo Tools
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCrop}
            className="p-2 rounded bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Crop className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crop Photo</span>
          </button>
          <button
            onClick={onPerspective}
            className="p-2 rounded bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Straighten (4-pt)</span>
          </button>
        </div>
      </div>

      {/* Alignment Tools */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-[11px] text-neutral-200">Alignment</span>
          <button
            onClick={() => onAlign('centerPage')}
            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
          >
            <Crosshair className="w-3 h-3" />
            <span>Center on Page</span>
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1 bg-neutral-900 p-1 rounded border border-neutral-700/60">
          <button
            onClick={() => onAlign('left')}
            title="Align Left"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-300 flex justify-center"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('center')}
            title="Align Center"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-300 flex justify-center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('right')}
            title="Align Right"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-300 flex justify-center"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('top')}
            title="Align Top"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-300 flex justify-center"
          >
            <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('middle')}
            title="Align Middle"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-300 flex justify-center"
          >
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('bottom')}
            title="Align Bottom"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-300 flex justify-center"
          >
            <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Non-destructive Image Adjustments */}
      <div className="pt-2 border-t border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[11px] text-neutral-200">
            Image Clarification Adjustments
          </span>
          <button
            onClick={resetAdjustments}
            title="Reset Adjustments"
            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Brightness */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Brightness</span>
            <span className="font-mono">{selectedLayer.adjustments?.brightness ?? 0}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={typeof selectedLayer.adjustments?.brightness === 'number' && !isNaN(selectedLayer.adjustments.brightness) ? selectedLayer.adjustments.brightness : 0}
            onChange={(e) => handleAdjustmentChange('brightness', parseFloat(e.target.value) || 0)}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Contrast</span>
            <span className="font-mono">{selectedLayer.adjustments?.contrast ?? 0}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={typeof selectedLayer.adjustments?.contrast === 'number' && !isNaN(selectedLayer.adjustments.contrast) ? selectedLayer.adjustments.contrast : 0}
            onChange={(e) => handleAdjustmentChange('contrast', parseFloat(e.target.value) || 0)}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Saturation</span>
            <span className="font-mono">{selectedLayer.adjustments?.saturation ?? 0}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={typeof selectedLayer.adjustments?.saturation === 'number' && !isNaN(selectedLayer.adjustments.saturation) ? selectedLayer.adjustments.saturation : 0}
            onChange={(e) => handleAdjustmentChange('saturation', parseFloat(e.target.value) || 0)}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded cursor-pointer"
          />
        </div>

        {/* Sharpness */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Sharpness</span>
            <span className="font-mono">{selectedLayer.adjustments?.sharpness ?? 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={typeof selectedLayer.adjustments?.sharpness === 'number' && !isNaN(selectedLayer.adjustments.sharpness) ? selectedLayer.adjustments.sharpness : 0}
            onChange={(e) => handleAdjustmentChange('sharpness', parseFloat(e.target.value) || 0)}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded cursor-pointer"
          />
        </div>

        {/* Exposure */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Exposure</span>
            <span className="font-mono">{selectedLayer.adjustments?.exposure ?? 0}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={typeof selectedLayer.adjustments?.exposure === 'number' && !isNaN(selectedLayer.adjustments.exposure) ? selectedLayer.adjustments.exposure : 0}
            onChange={(e) => handleAdjustmentChange('exposure', parseFloat(e.target.value) || 0)}
            className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded cursor-pointer"
          />
        </div>

        {/* Grayscale & Black/White Toggles */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-neutral-300 text-xs">Grayscale Mode</span>
            <input
              type="checkbox"
              checked={!!selectedLayer.adjustments?.grayscale}
              onChange={(e) => handleAdjustmentChange('grayscale', e.target.checked)}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-neutral-300 text-xs">High-Contrast B&W (Scan Mode)</span>
            <input
              type="checkbox"
              checked={!!selectedLayer.adjustments?.blackAndWhite}
              onChange={(e) => handleAdjustmentChange('blackAndWhite', e.target.checked)}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </label>

          {selectedLayer.adjustments?.blackAndWhite && (
            <div className="pl-2 border-l-2 border-neutral-700 mt-2">
              <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                <span>B&W Threshold</span>
                <span className="font-mono">{selectedLayer.adjustments?.bwThreshold ?? 128}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={typeof selectedLayer.adjustments?.bwThreshold === 'number' && !isNaN(selectedLayer.adjustments.bwThreshold) ? selectedLayer.adjustments.bwThreshold : 128}
                onChange={(e) => handleAdjustmentChange('bwThreshold', parseFloat(e.target.value) || 128)}
                className="w-full accent-blue-500 h-1.5 bg-neutral-700 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
