import React, { useState, useRef, useEffect } from 'react';
import { Page, DocumentLayer, ProjectSettings } from '../types';
import { getPageDimensionsMm, renderProcessedLayerCanvas } from '../utils/imageProcessing';

// 1 millimeter is approx 3.7795275591 screen pixels at standard 96 DPI
const SCREEN_PX_PER_MM = 3.7795275591;

/**
 * Dedicated visual renderer for an individual canvas layer.
 * Accurately renders cropped region, perspective corrections, and adjustments.
 */
const CanvasLayerContent: React.FC<{
  layer: DocumentLayer;
  filterStyle?: string;
}> = ({ layer, filterStyle }) => {
  const [perspectiveUrl, setPerspectiveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!layer.perspectivePoints) {
      setPerspectiveUrl(null);
      return;
    }

    let isMounted = true;
    renderProcessedLayerCanvas(layer).then((cvs) => {
      if (isMounted) {
        setPerspectiveUrl(cvs.toDataURL());
      }
    });

    return () => {
      isMounted = false;
    };
  }, [layer.perspectivePoints, layer.crop, layer.src]);

  // 1. Perspective Homography correction preview
  if (layer.perspectivePoints && perspectiveUrl) {
    return (
      <img
        src={perspectiveUrl}
        alt={layer.name}
        style={{ filter: filterStyle || undefined }}
        className="w-full h-full object-fill pointer-events-none select-none"
      />
    );
  }

  // 2. Exact crop positioning with hardware-accelerated CSS
  const crop = layer.crop;
  const hasCrop =
    !!crop &&
    (crop.width < 0.995 || crop.height < 0.995 || crop.x > 0.005 || crop.y > 0.005);

  if (hasCrop && crop) {
    const scaleX = 1 / Math.max(0.01, crop.width);
    const scaleY = 1 / Math.max(0.01, crop.height);
    const offsetX = -crop.x * scaleX * 100;
    const offsetY = -crop.y * scaleY * 100;

    return (
      <img
        src={layer.src}
        alt={layer.name}
        style={{
          position: 'absolute',
          width: `${scaleX * 100}%`,
          height: `${scaleY * 100}%`,
          left: `${offsetX}%`,
          top: `${offsetY}%`,
          maxWidth: 'none',
          maxHeight: 'none',
          objectFit: 'fill',
          filter: filterStyle || undefined,
        }}
        className="pointer-events-none select-none"
      />
    );
  }

  // 3. Uncropped standard document photo
  return (
    <img
      src={layer.src}
      alt={layer.name}
      style={{
        filter: filterStyle || undefined,
      }}
      className="w-full h-full object-fill pointer-events-none select-none"
    />
  );
};

interface CanvasAreaProps {
  page: Page;
  selectedLayerIds: string[];
  onSelectLayers: (ids: string[]) => void;
  onUpdateLayer: (id: string, updates: Partial<DocumentLayer>) => void;
  zoom: number;
  settings: ProjectSettings;
  onDoubleCrop: (layerId: string) => void;
}

type DragMode = 'none' | 'move' | 'resize' | 'rotate' | 'pan';

interface DragHandle {
  cursor: string;
  handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
}

const HANDLES: DragHandle[] = [
  { handle: 'nw', cursor: 'nwse-resize' },
  { handle: 'n', cursor: 'ns-resize' },
  { handle: 'ne', cursor: 'nesw-resize' },
  { handle: 'e', cursor: 'ew-resize' },
  { handle: 'se', cursor: 'nwse-resize' },
  { handle: 's', cursor: 'ns-resize' },
  { handle: 'sw', cursor: 'nesw-resize' },
  { handle: 'w', cursor: 'ew-resize' },
];

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  page,
  selectedLayerIds,
  onSelectLayers,
  onUpdateLayer,
  zoom,
  settings,
  onDoubleCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [cursorMm, setCursorMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drag interaction state
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [startMouse, setStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startLayerState, setStartLayerState] = useState<Record<string, { x: number; y: number; width: number; height: number; rotation: number }>>({});
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});

  const dims = getPageDimensionsMm(page);
  const paperWidthPx = dims.widthMm * SCREEN_PX_PER_MM * zoom;
  const paperHeightPx = dims.heightMm * SCREEN_PX_PER_MM * zoom;

  // Selected layers
  const selectedLayers = page.layers.filter((l) => selectedLayerIds.includes(l.id));
  const primarySelected = selectedLayers[0] || null;

  // Center canvas on first load
  useEffect(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const initialPanX = Math.max(40, (cw - paperWidthPx) / 2);
      const initialPanY = Math.max(40, (ch - paperHeightPx) / 2);
      setPan({ x: initialPanX, y: initialPanY });
    }
  }, [paperWidthPx, paperHeightPx]);

  // Track mouse coordinates in millimeters relative to top-left of the page
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!paperRef.current) return;
    const rect = paperRef.current.getBoundingClientRect();
    const mmX = (e.clientX - rect.left) / (SCREEN_PX_PER_MM * zoom);
    const mmY = (e.clientY - rect.top) / (SCREEN_PX_PER_MM * zoom);
    setCursorMm({
      x: Math.round(mmX * 10) / 10,
      y: Math.round(mmY * 10) / 10,
    });

    if (dragMode === 'pan') {
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartMouse({ x: e.clientX, y: e.clientY });
      return;
    }

    if (dragMode === 'move' && primarySelected && !primarySelected.locked) {
      const dxMm = (e.clientX - startMouse.x) / (SCREEN_PX_PER_MM * zoom);
      const dyMm = (e.clientY - startMouse.y) / (SCREEN_PX_PER_MM * zoom);

      const activeInitial = startLayerState[primarySelected.id];
      if (!activeInitial) return;

      let targetX = activeInitial.x + dxMm;
      let targetY = activeInitial.y + dyMm;

      const newSnap: { x?: number; y?: number } = {};

      if (settings.snapToCenter) {
        const pageCenterX = dims.widthMm / 2;
        const pageCenterY = dims.heightMm / 2;
        const layerCenterX = targetX + activeInitial.width / 2;
        const layerCenterY = targetY + activeInitial.height / 2;

        if (Math.abs(layerCenterX - pageCenterX) < 2.5) {
          targetX = pageCenterX - activeInitial.width / 2;
          newSnap.x = pageCenterX;
        }
        if (Math.abs(layerCenterY - pageCenterY) < 2.5) {
          targetY = pageCenterY - activeInitial.height / 2;
          newSnap.y = pageCenterY;
        }
      }

      if (settings.snapToEdges) {
        if (Math.abs(targetX) < 2.0) {
          targetX = 0;
          newSnap.x = 0;
        }
        if (Math.abs(targetY) < 2.0) {
          targetY = 0;
          newSnap.y = 0;
        }
        if (Math.abs(targetX + activeInitial.width - dims.widthMm) < 2.0) {
          targetX = dims.widthMm - activeInitial.width;
          newSnap.x = dims.widthMm;
        }
        if (Math.abs(targetY + activeInitial.height - dims.heightMm) < 2.0) {
          targetY = dims.heightMm - activeInitial.height;
          newSnap.y = dims.heightMm;
        }
      }

      if (settings.snapToGrid) {
        const sp = settings.gridSpacingMm;
        targetX = Math.round(targetX / sp) * sp;
        targetY = Math.round(targetY / sp) * sp;
      }

      setSnapLines(newSnap);

      // Move all selected layers proportionally
      selectedLayers.forEach((l) => {
        const init = startLayerState[l.id];
        if (init && !l.locked) {
          const deltaX = targetX - activeInitial.x;
          const deltaY = targetY - activeInitial.y;
          onUpdateLayer(l.id, {
            x: Math.round((init.x + deltaX) * 10) / 10,
            y: Math.round((init.y + deltaY) * 10) / 10,
          });
        }
      });
    }

    if (dragMode === 'resize' && primarySelected && !primarySelected.locked && activeHandle) {
      const dxMm = (e.clientX - startMouse.x) / (SCREEN_PX_PER_MM * zoom);
      const dyMm = (e.clientY - startMouse.y) / (SCREEN_PX_PER_MM * zoom);

      const init = startLayerState[primarySelected.id];
      if (!init) return;

      let newW = init.width;
      let newH = init.height;
      let newX = init.x;
      let newY = init.y;

      const lockRatio = primarySelected.aspectRatioLocked || e.shiftKey;
      const initialAspect = init.width / (init.height || 1);

      if (activeHandle.includes('e')) {
        newW = Math.max(5, init.width + dxMm);
      }
      if (activeHandle.includes('s')) {
        newH = Math.max(5, init.height + dyMm);
      }
      if (activeHandle.includes('w')) {
        const delta = Math.min(dxMm, init.width - 5);
        newW = init.width - delta;
        newX = init.x + delta;
      }
      if (activeHandle.includes('n')) {
        const delta = Math.min(dyMm, init.height - 5);
        newH = init.height - delta;
        newY = init.y + delta;
      }

      if (lockRatio) {
        if (['se', 'nw', 'ne', 'sw'].includes(activeHandle)) {
          newH = newW / initialAspect;
        }
      }

      onUpdateLayer(primarySelected.id, {
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      });
    }

    if (dragMode === 'rotate' && primarySelected && !primarySelected.locked) {
      const init = startLayerState[primarySelected.id];
      if (!init) return;

      const layerCenterScreenX =
        rect.left + (init.x + init.width / 2) * SCREEN_PX_PER_MM * zoom;
      const layerCenterScreenY =
        rect.top + (init.y + init.height / 2) * SCREEN_PX_PER_MM * zoom;

      const angleRad = Math.atan2(
        e.clientY - layerCenterScreenY,
        e.clientX - layerCenterScreenX
      );
      let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;

      // Snap to 0, 90, 180, 270 if close
      const snapAngles = [0, 90, 180, 270, 360];
      snapAngles.forEach((sa) => {
        if (Math.abs(angleDeg - sa) < 4) angleDeg = sa % 360;
      });

      onUpdateLayer(primarySelected.id, { rotation: angleDeg });
    }
  };

  const handleMouseUp = () => {
    setDragMode('none');
    setActiveHandle(null);
    setSnapLines({});
  };

  const handleLayerMouseDown = (
    e: React.MouseEvent,
    layer: DocumentLayer
  ) => {
    e.stopPropagation();

    // Multi-select with Shift or Ctrl
    if (e.shiftKey || e.ctrlKey) {
      if (selectedLayerIds.includes(layer.id)) {
        onSelectLayers(selectedLayerIds.filter((id) => id !== layer.id));
      } else {
        onSelectLayers([...selectedLayerIds, layer.id]);
      }
    } else {
      if (!selectedLayerIds.includes(layer.id)) {
        onSelectLayers([layer.id]);
      }
    }

    if (layer.locked) return;

    // Start Move
    setDragMode('move');
    setStartMouse({ x: e.clientX, y: e.clientY });

    const initMap: Record<string, any> = {};
    page.layers.forEach((l) => {
      initMap[l.id] = {
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation,
      };
    });
    setStartLayerState(initMap);
  };

  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    handle: string
  ) => {
    e.stopPropagation();
    if (!primarySelected || primarySelected.locked) return;

    setDragMode('resize');
    setActiveHandle(handle);
    setStartMouse({ x: e.clientX, y: e.clientY });

    const initMap: Record<string, any> = {};
    page.layers.forEach((l) => {
      initMap[l.id] = {
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation,
      };
    });
    setStartLayerState(initMap);
  };

  const handleRotateHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!primarySelected || primarySelected.locked) return;

    setDragMode('rotate');
    setStartMouse({ x: e.clientX, y: e.clientY });

    const initMap: Record<string, any> = {};
    page.layers.forEach((l) => {
      initMap[l.id] = {
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation,
      };
    });
    setStartLayerState(initMap);
  };

  // Click on paper background deselects
  const handlePaperMouseDown = (e: React.MouseEvent) => {
    if (e.target === paperRef.current || (e.target as HTMLElement).id === 'grid-overlay') {
      onSelectLayers([]);
    }
  };

  // Keyboard navigation for precision arrow nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedLayers.length === 0 || !primarySelected || primarySelected.locked) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const step = e.shiftKey ? 5.0 : 0.5; // mm
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      selectedLayers.forEach((l) => {
        onUpdateLayer(l.id, {
          x: Math.round((l.x + dx) * 10) / 10,
          y: Math.round((l.y + dy) * 10) / 10,
        });
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayers, primarySelected, onUpdateLayer]);

  // Safe margin calculations in px
  const safeMarginPx = settings.safeMarginMm * SCREEN_PX_PER_MM * zoom;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex-1 h-full bg-[#18181b] relative overflow-hidden flex flex-col select-none"
    >
      {/* Top Horizontal Precision Ruler (Millimeters) */}
      <div className="h-6 bg-[#202024] border-b border-neutral-800 flex items-center relative text-[9px] text-neutral-400 font-mono select-none shrink-0 overflow-hidden">
        <div className="w-6 h-full bg-[#27272a] border-r border-neutral-800 flex items-center justify-center text-[8px] text-neutral-500 font-bold shrink-0">
          mm
        </div>
        <div
          className="relative h-full"
          style={{ left: `${pan.x}px`, width: `${paperWidthPx}px` }}
        >
          {Array.from({ length: Math.ceil(dims.widthMm / 10) + 1 }).map((_, i) => {
            const mm = i * 10;
            const xPx = mm * SCREEN_PX_PER_MM * zoom;
            if (mm > dims.widthMm) return null;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-neutral-700 flex flex-col justify-end"
                style={{ left: `${xPx}px` }}
              >
                <span className="pl-0.5 leading-none mb-0.5">{mm}</span>
              </div>
            );
          })}

          {/* Cursor tick indicator on horizontal ruler */}
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-400 pointer-events-none z-10"
            style={{ left: `${cursorMm.x * SCREEN_PX_PER_MM * zoom}px` }}
          />

          {/* Primary selected object projection indicator */}
          {primarySelected && (
            <div
              className="absolute top-0 bottom-0 bg-blue-500/20 border-x border-blue-400/60 pointer-events-none"
              style={{
                left: `${primarySelected.x * SCREEN_PX_PER_MM * zoom}px`,
                width: `${primarySelected.width * SCREEN_PX_PER_MM * zoom}px`,
              }}
            />
          )}
        </div>
      </div>

      {/* Main Canvas + Left Vertical Ruler Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Precision Ruler (Millimeters) */}
        <div className="w-6 bg-[#202024] border-r border-neutral-800 text-[9px] text-neutral-400 font-mono select-none shrink-0 overflow-hidden relative">
          <div
            className="relative w-full"
            style={{ top: `${pan.y}px`, height: `${paperHeightPx}px` }}
          >
            {Array.from({ length: Math.ceil(dims.heightMm / 10) + 1 }).map((_, i) => {
              const mm = i * 10;
              const yPx = mm * SCREEN_PX_PER_MM * zoom;
              if (mm > dims.heightMm) return null;
              return (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-neutral-700 flex justify-end pr-0.5"
                  style={{ top: `${yPx}px` }}
                >
                  <span className="leading-none -mt-1.5 text-[8px]">{mm}</span>
                </div>
              );
            })}

            {/* Cursor tick indicator on vertical ruler */}
            <div
              className="absolute left-0 right-0 h-px bg-blue-400 pointer-events-none z-10"
              style={{ top: `${cursorMm.y * SCREEN_PX_PER_MM * zoom}px` }}
            />

            {/* Primary selected object projection indicator */}
            {primarySelected && (
              <div
                className="absolute left-0 right-0 bg-blue-500/20 border-y border-blue-400/60 pointer-events-none"
                style={{
                  top: `${primarySelected.y * SCREEN_PX_PER_MM * zoom}px`,
                  height: `${primarySelected.height * SCREEN_PX_PER_MM * zoom}px`,
                }}
              />
            )}
          </div>
        </div>

        {/* Pan and Canvas Work Area */}
        <div
          className="flex-1 h-full relative overflow-auto cursor-default bg-[#121215]"
          onMouseDown={(e) => {
            if (e.button === 1 || e.altKey) {
              setDragMode('pan');
              setStartMouse({ x: e.clientX, y: e.clientY });
            }
          }}
        >
          {/* Paper Sheet Component */}
          <div
            ref={paperRef}
            id="physical-paper-canvas"
            onMouseDown={handlePaperMouseDown}
            style={{
              position: 'absolute',
              left: `${pan.x}px`,
              top: `${pan.y}px`,
              width: `${paperWidthPx}px`,
              height: `${paperHeightPx}px`,
              backgroundColor: page.backgroundColor || '#FFFFFF',
              boxShadow: '0 12px 36px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
            }}
            className="transition-shadow select-none origin-top-left"
          >
            {/* Safe Margin Guide Boundary (Dashed red/blue line) */}
            {settings.guidesEnabled && (
              <div
                id="safe-margin-guide"
                className="absolute border border-dashed border-red-400/50 pointer-events-none z-10"
                style={{
                  left: `${safeMarginPx}px`,
                  top: `${safeMarginPx}px`,
                  width: `${paperWidthPx - safeMarginPx * 2}px`,
                  height: `${paperHeightPx - safeMarginPx * 2}px`,
                }}
              >
                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-red-500 font-semibold uppercase tracking-wider opacity-60">
                  Safe Printable Margin ({settings.safeMarginMm}mm)
                </span>
              </div>
            )}

            {/* Grid Overlay (10mm squares) */}
            {settings.gridEnabled && (
              <div
                id="grid-overlay"
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
                  backgroundSize: `${settings.gridSpacingMm * SCREEN_PX_PER_MM * zoom}px ${settings.gridSpacingMm * SCREEN_PX_PER_MM * zoom}px`,
                }}
              />
            )}

            {/* Smart Snap Crosshair Guides */}
            {snapLines.x !== undefined && (
              <div
                className="absolute top-0 bottom-0 w-px bg-amber-400 pointer-events-none z-30 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                style={{ left: `${snapLines.x * SCREEN_PX_PER_MM * zoom}px` }}
              />
            )}
            {snapLines.y !== undefined && (
              <div
                className="absolute left-0 right-0 h-px bg-amber-400 pointer-events-none z-30 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                style={{ top: `${snapLines.y * SCREEN_PX_PER_MM * zoom}px` }}
              />
            )}

            {/* Document Layers rendered on Canvas */}
            {page.layers.map((layer) => {
              if (!layer.visible) return null;
              const isSelected = selectedLayerIds.includes(layer.id);
              const layerXPx = layer.x * SCREEN_PX_PER_MM * zoom;
              const layerYPx = layer.y * SCREEN_PX_PER_MM * zoom;
              const layerWPx = layer.width * SCREEN_PX_PER_MM * zoom;
              const layerHPx = layer.height * SCREEN_PX_PER_MM * zoom;

              // Pre-calculate image CSS adjustments
              const adj = layer.adjustments;
              const filterParts: string[] = [];
              if (adj.brightness !== 0) filterParts.push(`brightness(${1 + adj.brightness / 100})`);
              if (adj.contrast !== 0) filterParts.push(`contrast(${1 + adj.contrast / 100})`);
              if (adj.saturation !== 0) filterParts.push(`saturate(${1 + adj.saturation / 100})`);
              if (adj.grayscale || adj.blackAndWhite) filterParts.push('grayscale(100%)');
              const filterStyle = filterParts.join(' ');

              return (
                <div
                  key={layer.id}
                  id={`layer-${layer.id}`}
                  onMouseDown={(e) => handleLayerMouseDown(e, layer)}
                  onDoubleClick={() => onDoubleCrop(layer.id)}
                  style={{
                    position: 'absolute',
                    left: `${layerXPx}px`,
                    top: `${layerYPx}px`,
                    width: `${layerWPx}px`,
                    height: `${layerHPx}px`,
                    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                    cursor: layer.locked ? 'not-allowed' : 'move',
                  }}
                  className={`group select-none ${
                    isSelected ? 'z-20' : 'z-10'
                  }`}
                >
                  {/* Layer Image Element */}
                  <div className="w-full h-full relative overflow-hidden bg-neutral-200/50">
                    <CanvasLayerContent layer={layer} filterStyle={filterStyle} />
                  </div>

                  {/* Selection Outline & Dimension Badge */}
                  {isSelected && (
                    <>
                      <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none shadow-[0_0_0_1px_rgba(255,255,255,0.8)]" />

                      {/* Top Physical Dimensions Pill */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30">
                        {Math.round(layer.width * 10) / 10} × {Math.round(layer.height * 10) / 10} mm
                      </div>

                      {/* Top Rotation Handle */}
                      {!layer.locked && (
                        <div
                          onMouseDown={handleRotateHandleMouseDown}
                          className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full cursor-grab hover:scale-125 transition-transform flex items-center justify-center z-30 shadow"
                          title="Drag to Rotate"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        </div>
                      )}

                      {/* 8 Resize Handles */}
                      {!layer.locked &&
                        HANDLES.map(({ handle, cursor }) => {
                          let posClass = '';
                          if (handle === 'nw') posClass = '-top-1.5 -left-1.5';
                          if (handle === 'n') posClass = '-top-1.5 left-1/2 -translate-x-1/2';
                          if (handle === 'ne') posClass = '-top-1.5 -right-1.5';
                          if (handle === 'e') posClass = 'top-1/2 -translate-y-1/2 -right-1.5';
                          if (handle === 'se') posClass = '-bottom-1.5 -right-1.5';
                          if (handle === 's') posClass = '-bottom-1.5 left-1/2 -translate-x-1/2';
                          if (handle === 'sw') posClass = '-bottom-1.5 -left-1.5';
                          if (handle === 'w') posClass = 'top-1/2 -translate-y-1/2 -left-1.5';

                          return (
                            <div
                              key={handle}
                              onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
                              style={{ cursor }}
                              className={`absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-sm hover:scale-125 transition-transform z-30 shadow-sm ${posClass}`}
                            />
                          );
                        })}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
