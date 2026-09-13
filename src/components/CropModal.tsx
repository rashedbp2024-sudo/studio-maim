import React, { useState, useRef, useEffect } from 'react';
import { DocumentLayer, CropBox } from '../types';
import { Check, X, RefreshCw, Scissors } from 'lucide-react';

interface CropModalProps {
  layer: DocumentLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyCrop: (
    layerId: string,
    crop: CropBox | null,
    targetDims?: { width: number; height: number }
  ) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  layer,
  isOpen,
  onClose,
  onApplyCrop,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [ratioMode, setRatioMode] = useState<'free' | 'original' | 'nid' | 'square' | 'a4'>('free');

  // Crop rectangle in normalized coordinates [0..1]
  const [crop, setCrop] = useState<CropBox>(
    layer?.crop || { x: 0.05, y: 0.05, width: 0.9, height: 0.9 }
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<string | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState<CropBox>(crop);

  // Sync crop whenever modal opens or layer changes
  useEffect(() => {
    if (isOpen && layer) {
      setCrop(layer.crop || { x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
      setRatioMode('free');
    }
  }, [isOpen, layer?.id]);

  const handleMouseDown = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragAction(action);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop({ ...crop });
  };

  useEffect(() => {
    if (!isDragging || !dragAction || !imageContainerRef.current) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = (e.clientX - startPos.x) / rect.width;
      const dy = (e.clientY - startPos.y) / rect.height;

      let newX = startCrop.x;
      let newY = startCrop.y;
      let newW = startCrop.width;
      let newH = startCrop.height;

      if (dragAction === 'move') {
        newX = Math.max(0, Math.min(1 - startCrop.width, startCrop.x + dx));
        newY = Math.max(0, Math.min(1 - startCrop.height, startCrop.y + dy));
      } else {
        if (dragAction.includes('e')) {
          newW = Math.max(0.05, Math.min(1 - startCrop.x, startCrop.width + dx));
        }
        if (dragAction.includes('s')) {
          newH = Math.max(0.05, Math.min(1 - startCrop.y, startCrop.height + dy));
        }
        if (dragAction.includes('w')) {
          const delta = Math.min(dx, startCrop.width - 0.05);
          newX = Math.max(0, startCrop.x + delta);
          newW = startCrop.width - (newX - startCrop.x);
        }
        if (dragAction.includes('n')) {
          const delta = Math.min(dy, startCrop.height - 0.05);
          newY = Math.max(0, startCrop.y + delta);
          newH = startCrop.height - (newY - startCrop.y);
        }
      }

      setCrop({
        x: Math.max(0, Math.min(1, newX)),
        y: Math.max(0, Math.min(1, newY)),
        width: Math.max(0.05, Math.min(1 - newX, newW)),
        height: Math.max(0.05, Math.min(1 - newY, newH)),
      });
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, dragAction, startPos, startCrop]);

  const applyPresetRatio = (mode: 'free' | 'original' | 'nid' | 'square' | 'a4') => {
    setRatioMode(mode);
    if (mode === 'free') return;

    let targetRatio = 1;
    const origW = layer.originalWidth || 1000;
    const origH = layer.originalHeight || 1000;
    const imgAspect = origW / origH;

    if (mode === 'original') targetRatio = imgAspect;
    if (mode === 'nid') targetRatio = 85.6 / 54.0; // ISO ID-1 Standard (1.585)
    if (mode === 'square') targetRatio = 1;
    if (mode === 'a4') targetRatio = 210 / 297;

    // Normalized ratio in image fraction space [0..1]
    const normalizedRatio = targetRatio / imgAspect;

    const currentCenterX = crop.x + crop.width / 2;
    const currentCenterY = crop.y + crop.height / 2;

    let newW = 0.85;
    let newH = newW / normalizedRatio;
    if (newH > 0.85) {
      newH = 0.85;
      newW = newH * normalizedRatio;
    }

    setCrop({
      x: Math.max(0, Math.min(1 - newW, currentCenterX - newW / 2)),
      y: Math.max(0, Math.min(1 - newH, currentCenterY - newH / 2)),
      width: Math.min(1, newW),
      height: Math.min(1, newH),
    });
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setRatioMode('free');
  };

  const handleSave = () => {
    // If crop is full image, reset
    if (crop.x <= 0.005 && crop.y <= 0.005 && crop.width >= 0.99 && crop.height >= 0.99) {
      const origW = layer.originalWidth || 1000;
      const origH = layer.originalHeight || 1000;
      const origAspect = origW / origH;
      const resetH = Math.round((layer.width / origAspect) * 10) / 10;
      onApplyCrop(layer.id, null, { width: layer.width, height: resetH });
    } else {
      const origW = layer.originalWidth || 1000;
      const origH = layer.originalHeight || 1000;
      const cropPixelW = crop.width * origW;
      const cropPixelH = crop.height * origH;
      const cropAspect = cropPixelW / (cropPixelH || 1);

      if (ratioMode === 'nid') {
        // NID Preset: Standard 85.6mm x 54.0mm
        onApplyCrop(layer.id, crop, { width: 85.6, height: 54.0 });
      } else {
        // Maintain physical width and adapt height to match crop aspect ratio exactly
        const newHeight = Math.round((layer.width / cropAspect) * 10) / 10;
        onApplyCrop(layer.id, crop, { width: layer.width, height: newHeight });
      }
    }
    onClose();
  };

  if (!isOpen || !layer) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#202024] border border-neutral-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm">Crop Document Photo</span>
            <span className="text-xs text-neutral-400">({layer.name})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Preset Options */}
        <div className="px-4 py-2 bg-[#18181b] border-b border-neutral-800 flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-[11px]">Ratio:</span>
            <button
              onClick={() => applyPresetRatio('free')}
              className={`px-2 py-1 rounded font-medium ${
                ratioMode === 'free' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => applyPresetRatio('original')}
              className={`px-2 py-1 rounded font-medium ${
                ratioMode === 'original' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              Original Ratio
            </button>
            <button
              onClick={() => applyPresetRatio('nid')}
              className={`px-2 py-1 rounded font-medium ${
                ratioMode === 'nid' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              NID Card (85.6×54mm)
            </button>
            <button
              onClick={() => applyPresetRatio('a4')}
              className={`px-2 py-1 rounded font-medium ${
                ratioMode === 'a4' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              A4 Ratio
            </button>
          </div>

          <button
            onClick={resetCrop}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Crop</span>
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="flex-1 p-6 flex items-center justify-center bg-[#121214] overflow-hidden">
          <div
            ref={imageContainerRef}
            className="relative max-w-full max-h-[60vh] select-none"
            style={{ display: 'inline-block' }}
          >
            {/* Background Image */}
            <img
              src={layer.src}
              alt={layer.name}
              className="max-h-[60vh] max-w-full object-contain pointer-events-none"
            />

            {/* Dark Mask outside crop area */}
            <div
              className="absolute inset-0 bg-black/60 pointer-events-none"
              style={{
                clipPath: `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%,
                  0% ${crop.y * 100}%,
                  ${crop.x * 100}% ${crop.y * 100}%,
                  ${crop.x * 100}% ${(crop.y + crop.height) * 100}%,
                  ${(crop.x + crop.width) * 100}% ${(crop.y + crop.height) * 100}%,
                  ${(crop.x + crop.width) * 100}% ${crop.y * 100}%,
                  0% ${crop.y * 100}%
                )`,
              }}
            />

            {/* Draggable Crop Box */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'move')}
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
                cursor: 'move',
              }}
              className="absolute border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(0,0,0,0.8)] z-10"
            >
              {/* 3x3 Rule-of-Thirds Grid inside crop */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* 8 Resize Handles */}
              <div
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
                className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-400 border border-black cursor-nwse-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 'n')}
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-400 border border-black cursor-ns-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
                className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 border border-black cursor-nesw-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 'e')}
                className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-emerald-400 border border-black cursor-ew-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 'se')}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-400 border border-black cursor-nwse-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 's')}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-400 border border-black cursor-ns-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-400 border border-black cursor-nesw-resize"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, 'w')}
                className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-emerald-400 border border-black cursor-ew-resize"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#1c1c20] border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Non-destructive: original customer photo remains intact.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
