import React, { useState, useRef, useEffect } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  FileDown,
  Printer,
  Undo2,
  Redo2,
  Copy,
  Scissors,
  Trash2,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Crop,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  HelpCircle,
  Shield,
  FileImage,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';

export interface MenuBarProps {
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveAsProject?: () => void;
  onImportImages?: () => void;
  onExportPdf?: () => void;
  onExportImage?: () => void;
  onPrint?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDeleteSelected?: () => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onZoomActual?: () => void;
  gridEnabled?: boolean;
  onToggleGrid?: () => void;
  guidesEnabled?: boolean;
  onToggleGuides?: () => void;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
  snapToCenter?: boolean;
  onToggleSnapToCenter?: () => void;
  onAddPage?: () => void;
  onDuplicatePage?: () => void;
  onDeletePage?: () => void;
  onCrop?: () => void;
  onOpenCrop?: () => void;
  onPerspective?: () => void;
  onOpenPerspective?: () => void;
  onResetAdjustments?: () => void;
  onAlign?: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'centerPage') => void;
  onOpenHelp?: () => void;
  onOpenPrivacy?: () => void;
  hasSelection?: boolean;
  hasActiveLayer?: boolean;
  onLoadSampleNidPair?: () => void;
  onLoadSampleBirthReg?: () => void;
  onLoadSampleMultiPage?: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveAsProject,
  onImportImages,
  onExportPdf,
  onExportImage,
  onPrint,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onDeleteSelected,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomActual,
  gridEnabled = false,
  onToggleGrid,
  guidesEnabled = false,
  onToggleGuides,
  snapEnabled = false,
  onToggleSnap,
  snapToCenter = false,
  onToggleSnapToCenter,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onCrop,
  onOpenCrop,
  onPerspective,
  onOpenPerspective,
  onResetAdjustments,
  onAlign,
  onOpenHelp,
  onOpenPrivacy,
  hasSelection = false,
  hasActiveLayer = false,
  onLoadSampleNidPair,
  onLoadSampleBirthReg,
  onLoadSampleMultiPage,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const effectiveDelete = onDelete || onDeleteSelected;
  const effectiveCrop = onCrop || onOpenCrop;
  const effectivePerspective = onPerspective || onOpenPerspective;
  const effectiveSnapToggle = onToggleSnap || onToggleSnapToCenter;
  const effectiveSnapEnabled = snapEnabled || snapToCenter;
  const isSelected = hasSelection || hasActiveLayer;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleItemClick = (action?: (() => void) | undefined) => {
    setActiveMenu(null);
    if (typeof action === 'function') {
      try {
        action();
      } catch (err) {
        console.error('Menu action execution error:', err);
      }
    }
  };

  return (
    <div
      ref={barRef}
      id="menu-bar"
      className="h-7 bg-[#202024] border-b border-neutral-800 flex items-center px-2 text-xs text-neutral-300 relative select-none z-40 shrink-0"
    >
      {/* File Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('file')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'file' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className="absolute top-full left-0 mt-0.5 w-60 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              onClick={() => handleItemClick(onNewProject)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-blue-400" /> New Project...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+N</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onOpenProject)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" /> Open Project (.dpls)...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+O</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              onClick={() => handleItemClick(onSaveProject)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-400" /> Save Project
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+S</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onSaveAsProject)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4 text-neutral-400" /> Save Project As...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+Shift+S</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              onClick={() => handleItemClick(onImportImages)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-400" /> Import Document Photos...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+I</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              onClick={() => handleItemClick(onExportPdf)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-rose-400" /> Export Print-Ready PDF...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+E</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onExportImage)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-teal-400" /> Export High-Res Image (PNG/JPG)...
              </span>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            {onLoadSampleNidPair && (
              <button
                onClick={() => handleItemClick(onLoadSampleNidPair)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left text-blue-300"
              >
                <span>Preset: Load Sample NID (Front+Back)</span>
              </button>
            )}
            {onLoadSampleBirthReg && (
              <button
                onClick={() => handleItemClick(onLoadSampleBirthReg)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left text-cyan-300"
              >
                <span>Preset: Load Sample Birth Certificate</span>
              </button>
            )}
            <div className="h-px bg-neutral-700 my-1" />
            <button
              onClick={() => handleItemClick(onPrint)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2 font-medium">
                <Printer className="w-4 h-4 text-blue-400" /> Print Document...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+P</kbd>
            </button>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('edit')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'edit' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className="absolute top-full left-0 mt-0.5 w-56 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              disabled={!canUndo}
              onClick={() => handleItemClick(onUndo)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                canUndo ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Undo2 className="w-4 h-4" /> Undo
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+Z</kbd>
            </button>
            <button
              disabled={!canRedo}
              onClick={() => handleItemClick(onRedo)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                canRedo ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Redo2 className="w-4 h-4" /> Redo
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+Y</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(onCut)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Cut
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+X</kbd>
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(onCopy)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" /> Copy
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+C</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onPaste)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" /> Paste
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+V</kbd>
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(onDuplicate)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+D</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              onClick={() => handleItemClick(onSelectAll)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span>Select All Layers</span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+A</kbd>
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(effectiveDelete)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-red-600 hover:text-white text-red-300' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Selected
              </span>
              <kbd className="text-[10px]">Del</kbd>
            </button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('view')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'view' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className="absolute top-full left-0 mt-0.5 w-56 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              onClick={() => handleItemClick(onZoomIn)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4" /> Zoom In
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl +</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onZoomOut)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4" /> Zoom Out
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl -</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onZoomFit)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <Maximize className="w-4 h-4" /> Fit Page to Screen
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl 0</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onZoomActual)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span>100% Actual Physical Size</span>
              <kbd className="text-[10px] text-neutral-400">Ctrl 1</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              onClick={() => handleItemClick(onToggleGrid)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <Grid className="w-4 h-4" /> Show Grid (10mm)
              </span>
              {gridEnabled && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
            <button
              onClick={() => handleItemClick(onToggleGuides)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span>Show Safe Margins & Guides</span>
              {guidesEnabled && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
            <button
              onClick={() => handleItemClick(effectiveSnapToggle)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span>Snap to Center & Edges</span>
              {effectiveSnapEnabled && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          </div>
        )}
      </div>

      {/* Page Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('page')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'page' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          Page
        </button>
        {activeMenu === 'page' && (
          <div className="absolute top-full left-0 mt-0.5 w-52 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              onClick={() => handleItemClick(onAddPage)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span>Add New A4 Page</span>
            </button>
            <button
              onClick={() => handleItemClick(onDuplicatePage)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span>Duplicate Current Page</span>
            </button>
            <button
              onClick={() => handleItemClick(onDeletePage)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-red-600 hover:text-white text-left text-red-300"
            >
              <span>Delete Current Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Image Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('image')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'image' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          Image
        </button>
        {activeMenu === 'image' && (
          <div className="absolute top-full left-0 mt-0.5 w-60 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(effectiveCrop)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-emerald-400" /> Crop Document Photo...
              </span>
              <kbd className="text-[10px] text-neutral-400">C</kbd>
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(effectivePerspective)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Straighten / Perspective Fix...
              </span>
              <kbd className="text-[10px] text-neutral-400">P</kbd>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(onResetAdjustments)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" /> Reset Image Adjustments
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Arrange Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('arrange')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'arrange' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          Arrange
        </button>
        {activeMenu === 'arrange' && (
          <div className="absolute top-full left-0 mt-0.5 w-56 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('centerPage'))}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left font-medium ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span>Center on A4 Page</span>
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('left'))}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <AlignLeft className="w-4 h-4" /> Align Left
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('center'))}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <AlignCenter className="w-4 h-4" /> Align Center
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('right'))}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <AlignRight className="w-4 h-4" /> Align Right
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('top'))}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <AlignVerticalJustifyStart className="w-4 h-4" /> Align Top
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('middle'))}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <AlignVerticalJustifyCenter className="w-4 h-4" /> Align Middle
            </button>
            <button
              disabled={!isSelected}
              onClick={() => handleItemClick(() => onAlign?.('bottom'))}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
                isSelected ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <AlignVerticalJustifyEnd className="w-4 h-4" /> Align Bottom
            </button>
          </div>
        )}
      </div>

      {/* Print Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('print')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'print' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          Print
        </button>
        {activeMenu === 'print' && (
          <div className="absolute top-full left-0 mt-0.5 w-60 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              onClick={() => handleItemClick(onPrint)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" /> Print Setup & Print...
              </span>
              <kbd className="text-[10px] text-neutral-400">Ctrl+P</kbd>
            </button>
            <button
              onClick={() => handleItemClick(onExportPdf)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <span className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-rose-400" /> Export PDF for Commercial Print...
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('help')}
          className={`px-2.5 py-1 rounded hover:bg-neutral-700/60 hover:text-white transition-colors ${
            activeMenu === 'help' ? 'bg-neutral-700 text-white' : ''
          }`}
        >
          Help
        </button>
        {activeMenu === 'help' && (
          <div className="absolute top-full left-0 mt-0.5 w-64 bg-[#27272a] border border-neutral-700 rounded shadow-2xl py-1 text-neutral-200 z-50">
            <button
              onClick={() => handleItemClick(onOpenHelp)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" /> Operator Quick Guide & Sizing Chart
            </button>
            <button
              onClick={() => handleItemClick(onOpenPrivacy)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white text-left"
            >
              <Shield className="w-4 h-4 text-emerald-400" /> Privacy & Document Authenticity Policy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
