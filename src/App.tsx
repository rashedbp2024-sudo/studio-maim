import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Project,
  Page,
  DocumentLayer,
  PaperSize,
  Orientation,
  CropBox,
  QuadPoints,
  ID_CARD_DIMENSIONS,
  DEFAULT_PROJECT_SETTINGS
} from './types';
import {
  createSampleNidFrontLayer,
  createSampleNidBackLayer,
  createSampleBirthRegistrationLayer,
  createSampleCertificateLayer,
  createSamplePassportLayer,
  generateSampleNidFront,
  generateSampleNidBack,
  generateSampleBirthRegistration,
  generateSampleCertificate,
  generateSamplePassportFront
} from './utils/sampleDocuments';
import { loadImage, getPageDimensionsMm } from './utils/imageProcessing';
import {
  saveProjectToFile,
  loadProjectFromFile,
  exportProjectToPdf,
  printPages,
  exportPageAsImage
} from './utils/exportUtils';

import { TitleBar } from './components/TitleBar';
import { MenuBar } from './components/MenuBar';
import { ToolBar } from './components/ToolBar';
import { PagesSidebar } from './components/PagesSidebar';
import { LayersSidebar } from './components/LayersSidebar';
import { AssetsSidebar } from './components/AssetsSidebar';
import { CanvasArea } from './components/CanvasArea';
import { InspectorPanel } from './components/InspectorPanel';
import { StatusBar } from './components/StatusBar';

import { NewProjectModal } from './components/NewProjectModal';
import { CropModal } from './components/CropModal';
import { PerspectiveModal } from './components/PerspectiveModal';
import { PrintModal } from './components/PrintModal';
import { HelpModal } from './components/HelpModal';

// Helper to create initial default project: NID Front + Back on A4 Page
function createInitialProject(): Project {
  const page1: Page = {
    id: 'page-1',
    name: 'NID Print Layout',
    paperSize: 'A4',
    orientation: 'portrait',
    backgroundColor: '#ffffff',
    layers: [
      createSampleNidFrontLayer(62.2, 55.0),
      createSampleNidBackLayer(62.2, 125.0),
    ],
  };

  return {
    id: 'project-default',
    version: '1.0',
    name: 'Customer Document Print',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [page1],
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    guides: { horizontal: [], vertical: [] },
  };
}

export default function App() {
  const [project, setProject] = useState<Project>(createInitialProject);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(0.9);
  const [sidebarTab, setSidebarTab] = useState<'pages' | 'layers' | 'assets'>('pages');

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<Project[]>([createInitialProject()]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState<boolean>(false);
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Modal target layer
  const [targetModalLayerId, setTargetModalLayerId] = useState<string | null>(null);

  // Clipboard state for Cut / Copy / Paste
  const [clipboard, setClipboard] = useState<DocumentLayer[]>([]);

  // File input ref for opening .dpls projects
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // Push state to history
  const pushState = useCallback((newProject: Project) => {
    setProject(newProject);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newProject].slice(-30); // Max 30 undo steps
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setProject(prev);
      setHistoryIndex((idx) => idx - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setProject(next);
      setHistoryIndex((idx) => idx + 1);
    }
  }, [history, historyIndex]);

  const activePage = project.pages[activePageIndex] || project.pages[0];

  // Primary selected layer
  const primarySelectedLayer =
    activePage?.layers.find((l) => selectedLayerIds.includes(l.id)) || null;

  // Layer Update Handler
  const handleUpdateLayer = useCallback(
    (layerId: string, updates: Partial<DocumentLayer>) => {
      setProject((prev) => {
        const nextPages = prev.pages.map((p, idx) => {
          if (idx !== activePageIndex) return p;
          return {
            ...p,
            layers: p.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
          };
        });
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          pages: nextPages,
        };
      });
    },
    [activePageIndex]
  );

  // Page Update Handler
  const handleUpdatePage = useCallback(
    (updates: Partial<Page>) => {
      const nextPages = project.pages.map((p, idx) =>
        idx === activePageIndex ? { ...p, ...updates } : p
      );
      pushState({
        ...project,
        updatedAt: new Date().toISOString(),
        pages: nextPages,
      });
    },
    [project, activePageIndex, pushState]
  );

  // Project Settings Update Handler
  const handleUpdateSettings = useCallback(
    (updates: Partial<typeof project.settings>) => {
      setProject((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
        },
      }));
    },
    []
  );

  // Delete Layer Handler
  const handleDeleteLayer = useCallback(
    (layerId: string) => {
      const nextPages = project.pages.map((p, idx) => {
        if (idx !== activePageIndex) return p;
        return {
          ...p,
          layers: p.layers.filter((l) => l.id !== layerId),
        };
      });
      setSelectedLayerIds((prev) => prev.filter((id) => id !== layerId));
      pushState({
        ...project,
        updatedAt: new Date().toISOString(),
        pages: nextPages,
      });
    },
    [project, activePageIndex, pushState]
  );

  // Delete Selected Layers
  const handleDeleteSelected = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    const nextPages = project.pages.map((p, idx) => {
      if (idx !== activePageIndex) return p;
      return {
        ...p,
        layers: p.layers.filter((l) => !selectedLayerIds.includes(l.id)),
      };
    });
    setSelectedLayerIds([]);
    pushState({
      ...project,
      updatedAt: new Date().toISOString(),
      pages: nextPages,
    });
  }, [project, activePageIndex, selectedLayerIds, pushState]);

  // Duplicate Selected Layers
  const handleDuplicateSelected = useCallback(() => {
    if (selectedLayerIds.length === 0 || !activePage) return;
    const newLayers: DocumentLayer[] = [];
    const newIds: string[] = [];

    activePage.layers.forEach((l) => {
      newLayers.push(l);
      if (selectedLayerIds.includes(l.id)) {
        const dupId = `layer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        newIds.push(dupId);
        newLayers.push({
          ...l,
          id: dupId,
          name: `${l.name} (Copy)`,
          x: l.x + 6,
          y: l.y + 6,
          locked: false,
        });
      }
    });

    handleUpdatePage(activePage.id, { layers: newLayers });
    setSelectedLayerIds(newIds);
  }, [selectedLayerIds, activePage, handleUpdatePage]);

  // Copy Selected Layers to internal clipboard
  const handleCopy = useCallback(() => {
    if (selectedLayerIds.length === 0 || !activePage) return;
    const selected = activePage.layers.filter((l) => selectedLayerIds.includes(l.id));
    setClipboard(selected);
  }, [selectedLayerIds, activePage]);

  // Cut Selected Layers
  const handleCut = useCallback(() => {
    if (selectedLayerIds.length === 0 || !activePage) return;
    const selected = activePage.layers.filter((l) => selectedLayerIds.includes(l.id));
    setClipboard(selected);
    handleDeleteSelected();
  }, [selectedLayerIds, activePage, handleDeleteSelected]);

  // Paste Layers from internal clipboard
  const handlePaste = useCallback(() => {
    if (clipboard.length === 0 || !activePage) return;
    const newLayers: DocumentLayer[] = [...activePage.layers];
    const newIds: string[] = [];
    clipboard.forEach((l, idx) => {
      const dupId = `layer-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      newIds.push(dupId);
      newLayers.push({
        ...l,
        id: dupId,
        name: `${l.name} (Copy)`,
        x: l.x + 8,
        y: l.y + 8,
        locked: false,
      });
    });
    handleUpdatePage(activePage.id, { layers: newLayers });
    setSelectedLayerIds(newIds);
  }, [clipboard, activePage, handleUpdatePage]);

  // Select All Layers on Active Page
  const handleSelectAll = useCallback(() => {
    if (!activePage) return;
    setSelectedLayerIds(activePage.layers.map((l) => l.id));
  }, [activePage]);

  // Reset Image Adjustments on Selected Layers
  const handleResetAdjustments = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    selectedLayerIds.forEach((id) => {
      handleUpdateLayer(id, {
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
    });
  }, [selectedLayerIds, handleUpdateLayer]);

  // Export Active Page as Image
  const handleExportImage = useCallback(() => {
    if (activePage) {
      exportPageAsImage(activePage, 'png', 300);
    }
  }, [activePage]);

  // Reorder Layer (Z-index stacking)
  const handleReorderLayer = useCallback(
    (layerId: string, action: 'up' | 'down' | 'top' | 'bottom') => {
      const currentLayers = [...activePage.layers];
      const index = currentLayers.findIndex((l) => l.id === layerId);
      if (index === -1) return;

      const layer = currentLayers.splice(index, 1)[0];

      if (action === 'top') {
        currentLayers.push(layer);
      } else if (action === 'bottom') {
        currentLayers.unshift(layer);
      } else if (action === 'up') {
        const nextIndex = Math.min(currentLayers.length, index + 1);
        currentLayers.splice(nextIndex, 0, layer);
      } else if (action === 'down') {
        const prevIndex = Math.max(0, index - 1);
        currentLayers.splice(prevIndex, 0, layer);
      }

      const nextPages = project.pages.map((p, idx) =>
        idx === activePageIndex ? { ...p, layers: currentLayers } : p
      );
      pushState({ ...project, pages: nextPages });
    },
    [project, activePageIndex, activePage, pushState]
  );

  // Add Page Handler
  const handleAddPage = useCallback(() => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: `Page ${project.pages.length + 1}`,
      paperSize: 'A4',
      orientation: 'portrait',
      backgroundColor: '#ffffff',
      layers: [],
    };
    const nextPages = [...project.pages, newPage];
    pushState({ ...project, pages: nextPages });
    setActivePageIndex(nextPages.length - 1);
    setSelectedLayerIds([]);
  }, [project, pushState]);

  // Duplicate Page
  const handleDuplicatePage = useCallback(
    (index: number) => {
      const pageToDup = project.pages[index];
      if (!pageToDup) return;
      const duplicated: Page = {
        ...pageToDup,
        id: `page-${Date.now()}`,
        name: `${pageToDup.name} (Copy)`,
        layers: pageToDup.layers.map((l) => ({
          ...l,
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        })),
      };
      const nextPages = [...project.pages];
      nextPages.splice(index + 1, 0, duplicated);
      pushState({ ...project, pages: nextPages });
      setActivePageIndex(index + 1);
    },
    [project, pushState]
  );

  // Delete Page
  const handleDeletePage = useCallback(
    (index: number) => {
      if (project.pages.length <= 1) return;
      const nextPages = project.pages.filter((_, i) => i !== index);
      pushState({ ...project, pages: nextPages });
      setActivePageIndex(Math.max(0, index - 1));
      setSelectedLayerIds([]);
    },
    [project, pushState]
  );

  // Move Page Order
  const handleMovePage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= project.pages.length) return;
      const nextPages = [...project.pages];
      const [moved] = nextPages.splice(fromIndex, 1);
      nextPages.splice(toIndex, 0, moved);
      pushState({ ...project, pages: nextPages });
      setActivePageIndex(toIndex);
    },
    [project, pushState]
  );

  // Rename Page
  const handleRenamePage = useCallback(
    (index: number, newName: string) => {
      const nextPages = project.pages.map((p, i) =>
        i === index ? { ...p, name: newName } : p
      );
      pushState({ ...project, pages: nextPages });
    },
    [project, pushState]
  );

  // Import Image Files directly onto the active page as separate layers
  const handleImportFiles = useCallback(
    async (files: FileList | File[]) => {
      const dims = getPageDimensionsMm(activePage);
      const newLayers: DocumentLayer[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const img = await loadImage(dataUrl);

        // Initial placement with cascading offset
        const offset = (activePage.layers.length + newLayers.length) * 8;
        const initialWidth = Math.min(120, dims.widthMm - 30);
        const aspect = img.naturalHeight / (img.naturalWidth || 1);
        const initialHeight = initialWidth * aspect;

        const layer: DocumentLayer = {
          id: `layer-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          src: dataUrl,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          x: Math.max(10, Math.min(dims.widthMm - initialWidth - 10, 20 + offset)),
          y: Math.max(10, Math.min(dims.heightMm - initialHeight - 10, 25 + offset)),
          width: Math.round(initialWidth * 10) / 10,
          height: Math.round(initialHeight * 10) / 10,
          rotation: 0,
          aspectRatioLocked: true,
          locked: false,
          visible: true,
          crop: null,
          perspectivePoints: null,
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
        };

        newLayers.push(layer);
      }

      if (newLayers.length > 0) {
        const nextPages = project.pages.map((p, idx) =>
          idx === activePageIndex ? { ...p, layers: [...p.layers, ...newLayers] } : p
        );
        pushState({ ...project, pages: nextPages });
        setSelectedLayerIds([newLayers[newLayers.length - 1].id]);
        setSidebarTab('layers');
      }
    },
    [activePage, activePageIndex, project, pushState]
  );

  // Import Single Sample Document Photo
  const handleImportSample = useCallback(
    async (name: string, dataUrl: string) => {
      const dims = getPageDimensionsMm(activePage);
      const img = await loadImage(dataUrl);

      const offset = activePage.layers.length * 10;
      const initialWidth = Math.min(140, dims.widthMm - 30);
      const aspect = img.naturalHeight / (img.naturalWidth || 1);
      const initialHeight = initialWidth * aspect;

      const layer: DocumentLayer = {
        id: `layer-${Date.now()}`,
        name: name.replace(/\.[^/.]+$/, ''),
        src: dataUrl,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        x: Math.max(10, Math.min(dims.widthMm - initialWidth - 10, 25 + offset)),
        y: Math.max(10, Math.min(dims.heightMm - initialHeight - 10, 30 + offset)),
        width: Math.round(initialWidth * 10) / 10,
        height: Math.round(initialHeight * 10) / 10,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        visible: true,
        crop: null,
        perspectivePoints: null,
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
      };

      const nextPages = project.pages.map((p, idx) =>
        idx === activePageIndex ? { ...p, layers: [...p.layers, layer] } : p
      );
      pushState({ ...project, pages: nextPages });
      setSelectedLayerIds([layer.id]);
      setSidebarTab('layers');
    },
    [activePage, activePageIndex, project, pushState]
  );

  // Import Sample NID Pair on Active Page
  const handleImportSampleNidPair = useCallback(() => {
    const front = createSampleNidFrontLayer(62.2, 50.0);
    const back = createSampleNidBackLayer(62.2, 120.0);

    const nextPages = project.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, layers: [...p.layers, front, back] } : p
    );
    pushState({ ...project, pages: nextPages });
    setSelectedLayerIds([front.id, back.id]);
    setSidebarTab('layers');
  }, [activePageIndex, project, pushState]);

  // Alignment Commands
  const handleAlign = useCallback(
    (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'centerPage') => {
      if (selectedLayerIds.length === 0) return;
      const dims = getPageDimensionsMm(activePage);

      const nextPages = project.pages.map((p, idx) => {
        if (idx !== activePageIndex) return p;

        const updatedLayers = p.layers.map((l) => {
          if (!selectedLayerIds.includes(l.id) || l.locked) return l;

          let newX = l.x;
          let newY = l.y;

          if (type === 'left') newX = project.settings.safeMarginMm;
          if (type === 'center') newX = (dims.widthMm - l.width) / 2;
          if (type === 'right') newX = dims.widthMm - project.settings.safeMarginMm - l.width;
          if (type === 'top') newY = project.settings.safeMarginMm;
          if (type === 'middle') newY = (dims.heightMm - l.height) / 2;
          if (type === 'bottom') newY = dims.heightMm - project.settings.safeMarginMm - l.height;
          if (type === 'centerPage') {
            newX = (dims.widthMm - l.width) / 2;
            newY = (dims.heightMm - l.height) / 2;
          }

          return {
            ...l,
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
          };
        });

        return { ...p, layers: updatedLayers };
      });

      pushState({ ...project, pages: nextPages });
    },
    [selectedLayerIds, activePage, activePageIndex, project, pushState]
  );

  // Fit to Page Width
  const handleFitWidth = useCallback(() => {
    if (!primarySelectedLayer || primarySelectedLayer.locked) return;
    const dims = getPageDimensionsMm(activePage);
    const availableWidth = dims.widthMm - project.settings.safeMarginMm * 2;
    const ratio = primarySelectedLayer.height / (primarySelectedLayer.width || 1);

    handleUpdateLayer(primarySelectedLayer.id, {
      x: project.settings.safeMarginMm,
      width: Math.round(availableWidth * 10) / 10,
      height: Math.round(availableWidth * ratio * 10) / 10,
    });
  }, [primarySelectedLayer, activePage, project.settings, handleUpdateLayer]);

  // Fit to Full Page
  const handleFitPage = useCallback(() => {
    if (!primarySelectedLayer || primarySelectedLayer.locked) return;
    const dims = getPageDimensionsMm(activePage);
    const availableWidth = dims.widthMm - project.settings.safeMarginMm * 2;
    const availableHeight = dims.heightMm - project.settings.safeMarginMm * 2;

    const imgAspect = primarySelectedLayer.originalWidth / (primarySelectedLayer.originalHeight || 1);
    const pageAspect = availableWidth / availableHeight;

    let newW = availableWidth;
    let newH = availableHeight;

    if (imgAspect > pageAspect) {
      newW = availableWidth;
      newH = newW / imgAspect;
    } else {
      newH = availableHeight;
      newW = newH * imgAspect;
    }

    handleUpdateLayer(primarySelectedLayer.id, {
      x: Math.round(((dims.widthMm - newW) / 2) * 10) / 10,
      y: Math.round(((dims.heightMm - newH) / 2) * 10) / 10,
      width: Math.round(newW * 10) / 10,
      height: Math.round(newH * 10) / 10,
    });
  }, [primarySelectedLayer, activePage, project.settings, handleUpdateLayer]);

  // Crop Handlers
  const handleOpenCrop = useCallback(() => {
    if (!primarySelectedLayer) return;
    setTargetModalLayerId(primarySelectedLayer.id);
    setIsCropOpen(true);
  }, [primarySelectedLayer]);

  const handleApplyCrop = useCallback(
    (
      layerId: string,
      crop: CropBox | null,
      targetDims?: { width: number; height: number }
    ) => {
      if (targetDims) {
        handleUpdateLayer(layerId, {
          crop,
          width: targetDims.width,
          height: targetDims.height,
        });
      } else {
        handleUpdateLayer(layerId, { crop });
      }
    },
    [handleUpdateLayer]
  );

  // Perspective Handlers
  const handleOpenPerspective = useCallback(() => {
    if (!primarySelectedLayer) return;
    setTargetModalLayerId(primarySelectedLayer.id);
    setIsPerspectiveOpen(true);
  }, [primarySelectedLayer]);

  const handleApplyPerspective = useCallback(
    (layerId: string, quad: QuadPoints | null) => {
      handleUpdateLayer(layerId, { perspectivePoints: quad });
    },
    [handleUpdateLayer]
  );

  // Workflow A Project Creation: Front + Back on same A4 page
  const handleCreateFrontBackProject = useCallback(
    async (
      frontSrc: string,
      backSrc: string,
      preset: 'front-above-back' | 'front-beside-back' | 'centered' | 'top-left-top-right' | 'custom'
    ) => {
      const frontImg = await loadImage(frontSrc);
      const backImg = await loadImage(backSrc);

      const cardW = ID_CARD_DIMENSIONS.widthMm; // 85.60 mm
      const cardH = ID_CARD_DIMENSIONS.heightMm; // 54.00 mm

      let frontX = 62.2;
      let frontY = 55.0;
      let backX = 62.2;
      let backY = 125.0;

      if (preset === 'front-beside-back') {
        frontX = 15.0;
        frontY = 100.0;
        backX = 108.0;
        backY = 100.0;
      } else if (preset === 'centered') {
        frontX = 62.2;
        frontY = 70.0;
        backX = 62.2;
        backY = 140.0;
      }

      const frontLayer: DocumentLayer = {
        id: `layer-front-${Date.now()}`,
        name: 'Document Front',
        src: frontSrc,
        originalWidth: frontImg.naturalWidth,
        originalHeight: frontImg.naturalHeight,
        x: frontX,
        y: frontY,
        width: cardW,
        height: cardH,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        visible: true,
        crop: null,
        perspectivePoints: null,
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
      };

      const backLayer: DocumentLayer = {
        id: `layer-back-${Date.now()}`,
        name: 'Document Back',
        src: backSrc,
        originalWidth: backImg.naturalWidth,
        originalHeight: backImg.naturalHeight,
        x: backX,
        y: backY,
        width: cardW,
        height: cardH,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        visible: true,
        crop: null,
        perspectivePoints: null,
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
      };

      const newProj: Project = {
        id: `project-${Date.now()}`,
        version: '1.0',
        name: 'Front + Back Print Layout',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          {
            id: `page-${Date.now()}`,
            name: 'NID / ID Card (Front+Back)',
            paperSize: 'A4',
            orientation: 'portrait',
            backgroundColor: '#ffffff',
            layers: [frontLayer, backLayer],
          },
        ],
        settings: { ...DEFAULT_PROJECT_SETTINGS },
        guides: { horizontal: [], vertical: [] },
      };

      pushState(newProj);
      setActivePageIndex(0);
      setSelectedLayerIds([frontLayer.id]);
    },
    [pushState]
  );

  // Workflow B Project Creation: Single Document (Birth Registration, Certificate)
  const handleCreateSingleDocProject = useCallback(
    async (
      docSrc: string,
      docName: string,
      preset: 'fit-a4' | 'fit-width' | 'fit-height' | 'original-ratio' | 'center-page'
    ) => {
      const img = await loadImage(docSrc);
      const isLandscape = img.naturalWidth > img.naturalHeight;

      // Page dimensions
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      let layerW = 180;
      let layerH = 250;
      let layerX = 15;
      let layerY = 20;

      const imgAspect = img.naturalWidth / (img.naturalHeight || 1);

      if (preset === 'fit-width') {
        layerW = availW;
        layerH = layerW / imgAspect;
        layerX = margin;
        layerY = Math.max(margin, (pageH - layerH) / 2);
      } else if (preset === 'fit-a4') {
        if (imgAspect > availW / availH) {
          layerW = availW;
          layerH = layerW / imgAspect;
        } else {
          layerH = availH;
          layerW = layerH * imgAspect;
        }
        layerX = (pageW - layerW) / 2;
        layerY = (pageH - layerH) / 2;
      } else {
        // original ratio / center
        layerW = Math.min(190, availW);
        layerH = layerW / imgAspect;
        if (layerH > availH) {
          layerH = availH;
          layerW = layerH * imgAspect;
        }
        layerX = (pageW - layerW) / 2;
        layerY = (pageH - layerH) / 2;
      }

      const layer: DocumentLayer = {
        id: `layer-${Date.now()}`,
        name: docName,
        src: docSrc,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        x: Math.round(layerX * 10) / 10,
        y: Math.round(layerY * 10) / 10,
        width: Math.round(layerW * 10) / 10,
        height: Math.round(layerH * 10) / 10,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        visible: true,
        crop: null,
        perspectivePoints: null,
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
      };

      const newProj: Project = {
        id: `project-${Date.now()}`,
        version: '1.0',
        name: `${docName} Print Layout`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          {
            id: `page-${Date.now()}`,
            name: docName,
            paperSize: 'A4',
            orientation: isLandscape ? 'landscape' : 'portrait',
            backgroundColor: '#ffffff',
            layers: [layer],
          },
        ],
        settings: { ...DEFAULT_PROJECT_SETTINGS },
        guides: { horizontal: [], vertical: [] },
      };

      pushState(newProj);
      setActivePageIndex(0);
      setSelectedLayerIds([layer.id]);
    },
    [pushState]
  );

  // Workflow C Project Creation: Multi-Page Mixed Project
  const handleCreateMultiPageSampleProject = useCallback(() => {
    // Page 1: NID Front + Back on A4
    const page1: Page = {
      id: 'page-nid',
      name: '1. NID (Front + Back)',
      paperSize: 'A4',
      orientation: 'portrait',
      backgroundColor: '#ffffff',
      layers: [
        createSampleNidFrontLayer(62.2, 50.0),
        createSampleNidBackLayer(62.2, 120.0),
      ],
    };

    // Page 2: Birth Registration Certificate
    const page2: Page = {
      id: 'page-birth',
      name: '2. Birth Registration',
      paperSize: 'A4',
      orientation: 'portrait',
      backgroundColor: '#ffffff',
      layers: [createSampleBirthRegistrationLayer()],
    };

    // Page 3: Degree Certificate
    const page3: Page = {
      id: 'page-cert',
      name: '3. Degree Certificate',
      paperSize: 'A4',
      orientation: 'landscape',
      backgroundColor: '#ffffff',
      layers: [createSampleCertificateLayer()],
    };

    // Page 4: Passport Specimen
    const page4: Page = {
      id: 'page-passport',
      name: '4. Passport Bio Page',
      paperSize: 'A4',
      orientation: 'portrait',
      backgroundColor: '#ffffff',
      layers: [createSamplePassportLayer()],
    };

    const multiProj: Project = {
      id: `project-${Date.now()}`,
      version: '1.0',
      name: 'Customer Job - Multi-Document Package',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [page1, page2, page3, page4],
      settings: { ...DEFAULT_PROJECT_SETTINGS },
      guides: { horizontal: [], vertical: [] },
    };

    pushState(multiProj);
    setActivePageIndex(0);
    setSelectedLayerIds([page1.layers[0].id]);
  }, [pushState]);

  // Blank Project Creation
  const handleCreateBlankProject = useCallback(
    (paperSize: PaperSize, orientation: Orientation) => {
      const blank: Project = {
        id: `project-${Date.now()}`,
        version: '1.0',
        name: 'Untitled Print Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          {
            id: `page-${Date.now()}`,
            name: 'Page 1',
            paperSize,
            orientation,
            backgroundColor: '#ffffff',
            layers: [],
          },
        ],
        settings: { ...DEFAULT_PROJECT_SETTINGS },
        guides: { horizontal: [], vertical: [] },
      };
      pushState(blank);
      setActivePageIndex(0);
      setSelectedLayerIds([]);
    },
    [pushState]
  );

  // Save / Load Project Files (.dpls)
  const handleSaveProject = useCallback(() => {
    saveProjectToFile(project);
  }, [project]);

  const handleOpenProjectFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        try {
          const loaded = await loadProjectFromFile(e.target.files[0]);
          pushState(loaded);
          setActivePageIndex(0);
          setSelectedLayerIds([]);
        } catch (err: any) {
          alert('Could not open project: ' + err.message);
        }
      }
    },
    [pushState]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewProjectOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleDuplicateSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleCopy();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleCut();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        projectFileInputRef.current?.click();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedLayerIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleSaveProject,
    handleUndo,
    handleRedo,
    selectedLayerIds,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleCopy,
    handleCut,
    handlePaste,
    handleSelectAll,
  ]);

  // Selected layers for Status bar
  const selectedLayers = activePage?.layers.filter((l) => selectedLayerIds.includes(l.id)) || [];

  return (
    <div className="flex flex-col w-screen h-screen bg-[#18181b] text-neutral-200 overflow-hidden select-none font-sans">
      {/* Hidden Project File Input */}
      <input
        ref={projectFileInputRef}
        type="file"
        accept=".dpls,application/json"
        onChange={handleOpenProjectFile}
        className="hidden"
      />

      {/* Windows Desktop Title Bar */}
      <TitleBar projectName={project.name} onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Professional Menu Bar */}
      <MenuBar
        onNewProject={() => setIsNewProjectOpen(true)}
        onOpenProject={() => projectFileInputRef.current?.click()}
        onSaveProject={handleSaveProject}
        onSaveAsProject={handleSaveProject}
        onImportImages={() => setSidebarTab('assets')}
        onExportPdf={() => exportProjectToPdf(project, 300)}
        onExportImage={handleExportImage}
        onPrint={() => setIsPrintOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        onDeleteSelected={handleDeleteSelected}
        onSelectAll={handleSelectAll}
        onZoomIn={() => setZoom((prev) => Math.min(3.0, Math.round((prev + 0.1) * 10) / 10))}
        onZoomOut={() => setZoom((prev) => Math.max(0.25, Math.round((prev - 0.1) * 10) / 10))}
        onZoomFit={() => setZoom(0.9)}
        onZoomActual={() => setZoom(1.0)}
        gridEnabled={project.settings.gridEnabled}
        onToggleGrid={() => handleUpdateSettings({ gridEnabled: !project.settings.gridEnabled })}
        guidesEnabled={project.settings.guidesEnabled}
        onToggleGuides={() => handleUpdateSettings({ guidesEnabled: !project.settings.guidesEnabled })}
        snapEnabled={project.settings.snapToCenter || project.settings.snapToEdges || project.settings.snapToGrid}
        onToggleSnap={() =>
          handleUpdateSettings({
            snapToCenter: !project.settings.snapToCenter,
            snapToEdges: !project.settings.snapToEdges,
          })
        }
        snapToCenter={project.settings.snapToCenter}
        onToggleSnapToCenter={() => handleUpdateSettings({ snapToCenter: !project.settings.snapToCenter })}
        onAddPage={handleAddPage}
        onDuplicatePage={() => handleDuplicatePage(activePageIndex)}
        onDeletePage={() => handleDeletePage(activePageIndex)}
        onCrop={handleOpenCrop}
        onOpenCrop={handleOpenCrop}
        onPerspective={handleOpenPerspective}
        onOpenPerspective={handleOpenPerspective}
        onResetAdjustments={handleResetAdjustments}
        onAlign={handleAlign}
        hasSelection={selectedLayerIds.length > 0}
        hasActiveLayer={!!primarySelectedLayer}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenPrivacy={() => setIsHelpOpen(true)}
        onLoadSampleNidPair={handleImportSampleNidPair}
        onLoadSampleBirthReg={() =>
          handleImportSample('Birth Registration.jpg', generateSampleBirthRegistration())
        }
        onLoadSampleMultiPage={handleCreateMultiPageSampleProject}
      />

      {/* Action ToolBar */}
      <ToolBar
        onNewProject={() => setIsNewProjectOpen(true)}
        onOpenProject={() => projectFileInputRef.current?.click()}
        onSaveProject={handleSaveProject}
        onImportImages={() => setSidebarTab('assets')}
        onQuickFrontBack={handleImportSampleNidPair}
        onQuickSingleDoc={() =>
          handleImportSample('Birth Registration.jpg', generateSampleBirthRegistration())
        }
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        hasSelection={selectedLayerIds.length > 0}
        hasActiveLayer={!!primarySelectedLayer}
        onCrop={handleOpenCrop}
        onPerspective={handleOpenPerspective}
        onAlign={handleAlign}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        gridEnabled={project.settings.gridEnabled}
        onToggleGrid={() => handleUpdateSettings({ gridEnabled: !project.settings.gridEnabled })}
        snapEnabled={project.settings.snapToCenter || project.settings.snapToEdges || project.settings.snapToGrid}
        onToggleSnap={() =>
          handleUpdateSettings({
            snapToCenter: !project.settings.snapToCenter,
            snapToEdges: !project.settings.snapToEdges,
          })
        }
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomIn={() => setZoom((prev) => Math.min(3.0, Math.round((prev + 0.1) * 10) / 10))}
        onZoomOut={() => setZoom((prev) => Math.max(0.25, Math.round((prev - 0.1) * 10) / 10))}
        onZoomFit={() => setZoom(0.9)}
        onPrint={() => setIsPrintOpen(true)}
        onExportPdf={() => exportProjectToPdf(project, 300)}
      />

      {/* Main Workspace (Left Sidebar + Center Canvas + Right Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Pages / Layers / Import Assets) */}
        <div className="w-64 bg-[#1c1c20] border-r border-neutral-800 flex flex-col shrink-0">
          {/* Sidebar Tab Switcher */}
          <div className="flex border-b border-neutral-800 bg-[#161618] text-xs">
            <button
              onClick={() => setSidebarTab('pages')}
              className={`flex-1 py-2 px-2 text-center font-medium border-b-2 transition-all ${
                sidebarTab === 'pages'
                  ? 'border-blue-500 text-white bg-[#1c1c20]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Pages ({project.pages.length})
            </button>
            <button
              onClick={() => setSidebarTab('layers')}
              className={`flex-1 py-2 px-2 text-center font-medium border-b-2 transition-all ${
                sidebarTab === 'layers'
                  ? 'border-purple-500 text-white bg-[#1c1c20]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Layers ({activePage?.layers.length || 0})
            </button>
            <button
              onClick={() => setSidebarTab('assets')}
              className={`flex-1 py-2 px-2 text-center font-medium border-b-2 transition-all ${
                sidebarTab === 'assets'
                  ? 'border-emerald-500 text-white bg-[#1c1c20]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Import
            </button>
          </div>

          {/* Active Sidebar Component */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'pages' && (
              <PagesSidebar
                pages={project.pages}
                activePageIndex={activePageIndex}
                onSelectPage={(index) => {
                  setActivePageIndex(index);
                  setSelectedLayerIds([]);
                }}
                onAddPage={handleAddPage}
                onDuplicatePage={handleDuplicatePage}
                onDeletePage={handleDeletePage}
                onMovePage={handleMovePage}
                onRenamePage={handleRenamePage}
              />
            )}

            {sidebarTab === 'layers' && (
              <LayersSidebar
                layers={activePage?.layers || []}
                selectedLayerIds={selectedLayerIds}
                onSelectLayer={(id, isMulti) => {
                  if (isMulti) {
                    setSelectedLayerIds((prev) =>
                      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                    );
                  } else {
                    setSelectedLayerIds([id]);
                  }
                }}
                onToggleVisibility={(id) => {
                  const target = activePage.layers.find((l) => l.id === id);
                  if (target) handleUpdateLayer(id, { visible: !target.visible });
                }}
                onToggleLock={(id) => {
                  const target = activePage.layers.find((l) => l.id === id);
                  if (target) handleUpdateLayer(id, { locked: !target.locked });
                }}
                onRenameLayer={(id, newName) => handleUpdateLayer(id, { name: newName })}
                onDeleteLayer={handleDeleteLayer}
                onReorderLayer={handleReorderLayer}
              />
            )}

            {sidebarTab === 'assets' && (
              <AssetsSidebar
                onImportFiles={handleImportFiles}
                onImportSample={handleImportSample}
                onImportSampleNidPair={handleImportSampleNidPair}
              />
            )}
          </div>
        </div>

        {/* Center Interactive Precision Canvas Area */}
        <CanvasArea
          page={activePage}
          selectedLayerIds={selectedLayerIds}
          onSelectLayers={setSelectedLayerIds}
          onUpdateLayer={handleUpdateLayer}
          zoom={zoom}
          settings={project.settings}
          onDoubleCrop={(layerId) => {
            setTargetModalLayerId(layerId);
            setIsCropOpen(true);
          }}
        />

        {/* Right Inspector & Adjustments Panel */}
        <div className="w-80 bg-[#1c1c20] border-l border-neutral-800 flex flex-col shrink-0">
          <InspectorPanel
            page={activePage}
            selectedLayer={primarySelectedLayer}
            onUpdateLayer={handleUpdateLayer}
            onUpdatePage={handleUpdatePage}
            onCrop={handleOpenCrop}
            onPerspective={handleOpenPerspective}
            onAlign={handleAlign}
            onFitWidth={handleFitWidth}
            onFitPage={handleFitPage}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        page={activePage}
        pageIndex={activePageIndex}
        totalPages={project.pages.length}
        selectedLayers={selectedLayers}
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomFit={() => setZoom(1.0)}
      />

      {/* New Project Wizard Modal */}
      {isNewProjectOpen && (
        <NewProjectModal
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
          onCreateBlankProject={handleCreateBlankProject}
          onCreateFrontBackProject={handleCreateFrontBackProject}
          onCreateSingleDocProject={handleCreateSingleDocProject}
          onCreateMultiPageSampleProject={handleCreateMultiPageSampleProject}
        />
      )}

      {/* Crop Modal */}
      {isCropOpen && (activePage.layers.find((l) => l.id === targetModalLayerId) || primarySelectedLayer) && (
        <CropModal
          layer={
            activePage.layers.find((l) => l.id === targetModalLayerId) || primarySelectedLayer!
          }
          isOpen={isCropOpen}
          onClose={() => {
            setIsCropOpen(false);
            setTargetModalLayerId(null);
          }}
          onApplyCrop={handleApplyCrop}
        />
      )}

      {/* Perspective Correction Modal */}
      {isPerspectiveOpen && (activePage.layers.find((l) => l.id === targetModalLayerId) || primarySelectedLayer) && (
        <PerspectiveModal
          layer={
            activePage.layers.find((l) => l.id === targetModalLayerId) || primarySelectedLayer!
          }
          isOpen={isPerspectiveOpen}
          onClose={() => {
            setIsPerspectiveOpen(false);
            setTargetModalLayerId(null);
          }}
          onApplyPerspective={handleApplyPerspective}
        />
      )}

      {/* High-Resolution Windows Print Output Modal */}
      {isPrintOpen && (
        <PrintModal
          project={project}
          activePageIndex={activePageIndex}
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
        />
      )}

      {/* Help & Reference Modal */}
      {isHelpOpen && <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
