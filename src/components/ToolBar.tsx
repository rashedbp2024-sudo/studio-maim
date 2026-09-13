import React from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  ImagePlus,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Crop,
  SlidersHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Crosshair,
  Grid,
  Magnet,
  Maximize,
  ZoomIn,
  ZoomOut,
  Printer,
  FileDown,
  Layers,
  CreditCard,
  FileText
} from 'lucide-react';

export interface ToolBarProps {
  onNewProject?: () => void;
  onNew?: () => void;
  onOpenProject?: () => void;
  onOpen?: () => void;
  onSaveProject?: () => void;
  onSave?: () => void;
  onImportImages?: () => void;
  onQuickFrontBack?: () => void;
  onQuickSingleDoc?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDuplicate?: () => void;
  onDelete?: () => void;
  hasSelection?: boolean;
  hasActiveLayer?: boolean;
  onCrop?: () => void;
  onPerspective?: () => void;
  onAlign?: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'centerPage') => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
  gridEnabled?: boolean;
  onToggleGrid?: () => void;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
  zoom?: number;
  onZoomChange?: (z: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  // Extra compatibility props
  guidesEnabled?: boolean;
  onToggleGuides?: () => void;
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
  snapToCenter?: boolean;
  onToggleSnapToCenter?: () => void;
  onAddPage?: () => void;
  onImportSampleNidPair?: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  onNewProject,
  onNew,
  onOpenProject,
  onOpen,
  onSaveProject,
  onSave,
  onImportImages,
  onQuickFrontBack,
  onQuickSingleDoc,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onDuplicate,
  onDelete,
  hasSelection = false,
  hasActiveLayer = false,
  onCrop,
  onPerspective,
  onAlign,
  onFitWidth,
  onFitPage,
  gridEnabled = true,
  onToggleGrid,
  snapEnabled = true,
  onToggleSnap,
  zoom = 0.9,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onPrint,
  onExportPdf,
  onImportSampleNidPair,
}) => {
  const safeZoom = typeof zoom === 'number' && !isNaN(zoom) && zoom > 0 ? zoom : 0.9;
  const zoomPercent = Math.round(safeZoom * 100);
  const handleNew = onNewProject || onNew;
  const handleOpen = onOpenProject || onOpen;
  const handleSave = onSaveProject || onSave;
  const handleFrontBack = onQuickFrontBack || onImportSampleNidPair;
  const isSelected = hasSelection || hasActiveLayer;
  return (
    <div
      id="main-toolbar"
      className="h-10 bg-[#252529] border-b border-neutral-800 flex items-center justify-between px-3 gap-1 select-none text-neutral-300 text-xs shrink-0 overflow-x-auto"
    >
      {/* Left group: File & Quick Workflow Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleNew}
          title="New Project (Ctrl+N)"
          className="p-1.5 rounded hover:bg-neutral-700/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <FilePlus className="w-4 h-4 text-blue-400" />
          <span className="hidden xl:inline text-[11px] font-medium">New</span>
        </button>
        <button
          onClick={handleOpen}
          title="Open Project (.dpls) (Ctrl+O)"
          className="p-1.5 rounded hover:bg-neutral-700/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline text-[11px] font-medium">Open</span>
        </button>
        <button
          onClick={handleSave}
          title="Save Project (Ctrl+S)"
          className="p-1.5 rounded hover:bg-neutral-700/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          <span className="hidden xl:inline text-[11px] font-medium">Save</span>
        </button>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Quick Setup Wizards */}
        <button
          onClick={handleFrontBack}
          title="Workflow A: Front + Back Document (NID, Passport, Driving License on same A4)"
          className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 font-medium transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px]">Front + Back (NID)</span>
        </button>

        <button
          onClick={onQuickSingleDoc}
          title="Workflow B: Single Document (Birth Registration, Certificate, Trade License)"
          className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 font-medium transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px]">Single Doc</span>
        </button>

        <button
          onClick={onImportImages}
          title="Import Customer Images (Ctrl+I)"
          className="p-1.5 rounded hover:bg-neutral-700/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ImagePlus className="w-4 h-4 text-emerald-400" />
          <span className="hidden lg:inline text-[11px] font-medium">Import</span>
        </button>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* History actions */}
        <button
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded transition-colors ${
            canUndo ? 'hover:bg-neutral-700/70 hover:text-white text-neutral-200' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded transition-colors ${
            canRedo ? 'hover:bg-neutral-700/70 hover:text-white text-neutral-200' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Selected Layer Tools */}
        <button
          disabled={!isSelected}
          onClick={onCrop}
          title="Crop Document Photo (C)"
          className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
            isSelected ? 'hover:bg-neutral-700/70 text-emerald-400 hover:text-emerald-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Crop</span>
        </button>

        <button
          disabled={!isSelected}
          onClick={onPerspective}
          title="Straighten / Perspective Correction (P)"
          className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
            isSelected ? 'hover:bg-neutral-700/70 text-cyan-400 hover:text-cyan-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Straighten</span>
        </button>

        <button
          disabled={!isSelected}
          onClick={onDuplicate}
          title="Duplicate Selected (Ctrl+D)"
          className={`p-1.5 rounded transition-colors ${
            isSelected ? 'hover:bg-neutral-700/70 text-neutral-200' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          disabled={!isSelected}
          onClick={onDelete}
          title="Delete Selected (Del)"
          className={`p-1.5 rounded transition-colors ${
            isSelected ? 'hover:bg-red-600/30 text-red-400' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Alignment Tools */}
        <div className="flex items-center gap-0.5">
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('centerPage')}
            title="Center on A4 Page"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-blue-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('left')}
            title="Align Left"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-neutral-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('center')}
            title="Align Horizontal Center"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-neutral-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('right')}
            title="Align Right"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-neutral-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('top')}
            title="Align Top"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-neutral-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('middle')}
            title="Align Middle (Vertical)"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-neutral-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!isSelected}
            onClick={() => onAlign?.('bottom')}
            title="Align Bottom"
            className={`p-1.5 rounded transition-colors ${
              isSelected ? 'hover:bg-neutral-700/70 text-neutral-300' : 'text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Page fitting */}
        <button
          disabled={!isSelected}
          onClick={onFitWidth}
          title="Fit Document to Page Width (keeping margins)"
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            isSelected ? 'hover:bg-neutral-700/70 text-neutral-200' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          Fit Width
        </button>
        <button
          disabled={!isSelected}
          onClick={onFitPage}
          title="Fit to Page (Maintain Aspect Ratio)"
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            isSelected ? 'hover:bg-neutral-700/70 text-neutral-200' : 'text-neutral-500 opacity-40 cursor-not-allowed'
          }`}
        >
          Fit Page
        </button>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Snapping & Grid */}
        <button
          onClick={onToggleGrid}
          title={gridEnabled ? "Disable Grid" : "Enable Grid (10mm)"}
          className={`p-1.5 rounded transition-colors ${
            gridEnabled ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'hover:bg-neutral-700/70 text-neutral-400'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleSnap}
          title={snapEnabled ? "Disable Smart Snapping" : "Enable Smart Snapping (Center & Edges)"}
          className={`p-1.5 rounded transition-colors ${
            snapEnabled ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'hover:bg-neutral-700/70 text-neutral-400'
          }`}
        >
          <Magnet className="w-4 h-4" />
        </button>
      </div>

      {/* Right group: Zoom, PDF Export, Print */}
      <div className="flex items-center gap-1.5">
        {/* Zoom Controls */}
        <div className="flex items-center bg-neutral-800/80 rounded border border-neutral-700 px-1">
          <button
            onClick={() => onZoomOut?.()}
            title="Zoom Out"
            className="p-1 hover:text-white text-neutral-400"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <select
            value={zoomPercent}
            onChange={(e) => onZoomChange?.(Number(e.target.value) / 100)}
            className="bg-transparent text-[11px] text-neutral-200 font-mono py-0.5 px-1 outline-none border-0 cursor-pointer"
          >
            <option value="25" className="bg-neutral-800">25%</option>
            <option value="50" className="bg-neutral-800">50%</option>
            <option value="75" className="bg-neutral-800">75%</option>
            <option value="90" className="bg-neutral-800">90%</option>
            <option value="100" className="bg-neutral-800">100%</option>
            <option value="125" className="bg-neutral-800">125%</option>
            <option value="150" className="bg-neutral-800">150%</option>
            <option value="200" className="bg-neutral-800">200%</option>
            {![25, 50, 75, 90, 100, 125, 150, 200].includes(zoomPercent) && (
              <option value={zoomPercent} className="bg-neutral-800">{zoomPercent}%</option>
            )}
          </select>
          <button
            onClick={() => onZoomIn?.()}
            title="Zoom In"
            className="p-1 hover:text-white text-neutral-400"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onZoomFit?.()}
            title="Fit to Window (Ctrl+0)"
            className="p-1 hover:text-white text-neutral-400 ml-0.5"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Primary Export & Print Buttons */}
        <button
          onClick={onExportPdf}
          title="Export Print-Ready PDF at 300 DPI (Ctrl+E)"
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 font-medium flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <FileDown className="w-4 h-4 text-rose-400" />
          <span className="text-xs">Export PDF</span>
        </button>

        <button
          onClick={onPrint}
          title="Print to Windows Printer (Ctrl+P)"
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span className="text-xs">Print</span>
        </button>
      </div>
    </div>
  );
};
