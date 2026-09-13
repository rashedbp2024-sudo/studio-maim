import React, { useState, useRef, useEffect } from 'react';
import { DocumentLayer, QuadPoints, Point2D } from '../types';
import { SlidersHorizontal, Check, X, RefreshCw, ZoomIn } from 'lucide-react';
import { applyPerspectiveWarp, loadImage } from '../utils/imageProcessing';

interface PerspectiveModalProps {
  layer: DocumentLayer | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyPerspective: (layerId: string, quad: QuadPoints | null) => void;
}

export const PerspectiveModal: React.FC<PerspectiveModalProps> = ({
  layer,
  isOpen,
  onClose,
  onApplyPerspective,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activePin, setActivePin] = useState<number | null>(null);
  const [loupePoint, setLoupePoint] = useState<Point2D | null>(null);

  // Normalized quad corners [0..1]: [Top-Left, Top-Right, Bottom-Right, Bottom-Left]
  const [corners, setCorners] = useState<QuadPoints>(
    layer?.perspectivePoints || [
      { x: 0.05, y: 0.05 }, // Top-Left
      { x: 0.95, y: 0.05 }, // Top-Right
      { x: 0.95, y: 0.95 }, // Bottom-Right
      { x: 0.05, y: 0.95 }, // Bottom-Left
    ]
  );

  const PIN_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];
  const PIN_LABELS = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'];

  // Update live straightened preview canvas
  useEffect(() => {
    let active = true;
    if (!layer?.src) return;
    loadImage(layer.src).then((img) => {
      if (!active || !previewCanvasRef.current) return;
      const warped = applyPerspectiveWarp(img, corners, 300, 200);
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 300, 200);
        ctx.drawImage(warped, 0, 0, 300, 200);
      }
    });
    return () => {
      active = false;
    };
  }, [layer.src, corners]);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePin(index);
    setLoupePoint(corners[index]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activePin === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xNorm = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yNorm = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const next: QuadPoints = [...corners] as QuadPoints;
    next[activePin] = {
      x: Math.round(xNorm * 1000) / 1000,
      y: Math.round(yNorm * 1000) / 1000,
    };
    setCorners(next);
    setLoupePoint(next[activePin]);
  };

  const handleMouseUp = () => {
    setActivePin(null);
  };

  const resetCorners = () => {
    setCorners([
      { x: 0.05, y: 0.05 },
      { x: 0.95, y: 0.05 },
      { x: 0.95, y: 0.95 },
      { x: 0.05, y: 0.95 },
    ]);
  };

  const handleSave = () => {
    // If corners are basically the entire rectangle, treat as null
    const [tl, tr, br, bl] = corners;
    if (
      tl.x <= 0.02 && tl.y <= 0.02 &&
      tr.x >= 0.98 && tr.y <= 0.02 &&
      br.x >= 0.98 && br.y >= 0.98 &&
      bl.x <= 0.02 && bl.y >= 0.98
    ) {
      onApplyPerspective(layer.id, null);
    } else {
      onApplyPerspective(layer.id, corners);
    }
    onClose();
  };

  if (!isOpen || !layer) return null;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#202024] border border-neutral-700 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-sm">
              Perspective Correction & Document Straightener
            </span>
            <span className="text-xs text-neutral-400">({layer.name})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="px-4 py-2 bg-[#18181b] border-b border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-neutral-300">
            Drag the 4 corner pins to match the tilted edges of the customer's document photo.
          </span>
          <button
            onClick={resetCorners}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Pins</span>
          </button>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 p-6 flex gap-4 bg-[#121214] overflow-hidden">
          {/* Main Pin Editor on Document */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/40 rounded-lg p-2">
            <div
              ref={containerRef}
              className="relative max-w-full max-h-[60vh] select-none"
              style={{ display: 'inline-block' }}
            >
              {/* Customer Photo */}
              <img
                src={layer.src}
                alt={layer.name}
                className="max-h-[60vh] max-w-full object-contain pointer-events-none"
              />

              {/* SVG Polygon connecting the 4 pins */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={corners.map((c) => `${c.x * 100}%,${c.y * 100}%`).join(' ')}
                  fill="rgba(6, 182, 212, 0.15)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* 4 Interactive Corner Pins */}
              {corners.map((c, i) => (
                <div
                  key={i}
                  onMouseDown={(e) => handleMouseDown(i, e)}
                  style={{
                    left: `${c.x * 100}%`,
                    top: `${c.y * 100}%`,
                    backgroundColor: PIN_COLORS[i],
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center text-[10px] font-bold text-black hover:scale-125 transition-transform ${
                    activePin === i ? 'ring-4 ring-cyan-400 scale-125' : ''
                  }`}
                  title={`${PIN_LABELS[i]} (Drag to place on document corner)`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Right Preview & Loupe Panel */}
          <div className="w-80 bg-[#1c1c20] border border-neutral-800 rounded-lg p-3 flex flex-col justify-between shrink-0">
            <div>
              <div className="text-xs font-semibold text-neutral-200 mb-2 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Straightened Result Preview</span>
              </div>
              <div className="w-full h-48 bg-black/60 rounded border border-neutral-700 flex items-center justify-center overflow-hidden mb-3">
                <canvas
                  ref={previewCanvasRef}
                  width={300}
                  height={200}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Loupe / Precision Corner Magnifier */}
              <div className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Precision Corner Alignment</span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-2 leading-tight">
                {activePin !== null
                  ? `Adjusting Pin #${activePin + 1}: ${PIN_LABELS[activePin]}`
                  : 'Click and drag any of the 4 colored pins to position them onto document corners.'}
              </p>

              {/* Pin Coordinates list */}
              <div className="space-y-1 text-[11px] font-mono">
                {corners.map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-1 rounded ${
                      activePin === i ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIN_COLORS[i] }}
                      />
                      <span>Pin {i + 1} ({PIN_LABELS[i]}):</span>
                    </span>
                    <span>
                      {Math.round(c.x * 100)}%, {Math.round(c.y * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 bg-neutral-900/60 rounded border border-neutral-800 text-[10px] text-neutral-400 mt-3">
              <span className="text-cyan-400 font-semibold">Note:</span> Rectification uses bilinear backward homography sampling to keep document text sharp and clear without altering genuine official information.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#1c1c20] border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Perspective correction only straightens the camera angle and preserves document authenticity.
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
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Apply Straightening</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
