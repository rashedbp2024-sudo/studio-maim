export type PaperSize = 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal' | 'Custom';
export type Orientation = 'portrait' | 'landscape';
export type MeasurementUnit = 'mm' | 'cm' | 'in' | 'px';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export const PAPER_DIMENSIONS: Record<PaperSize, PaperDimensions> = {
  A4: { widthMm: 210, heightMm: 297 },
  A5: { widthMm: 148, heightMm: 210 },
  A3: { widthMm: 297, heightMm: 420 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
  Legal: { widthMm: 215.9, heightMm: 355.6 },
  Custom: { widthMm: 210, heightMm: 297 },
};

// Standard ID card physical dimensions (ISO/IEC 7810 ID-1: 85.60 mm × 53.98 mm)
export const ID_CARD_DIMENSIONS = {
  widthMm: 85.6,
  heightMm: 54.0,
};

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // 0 to 100
  exposure: number; // -100 to 100
  grayscale: boolean;
  blackAndWhite: boolean;
  bwThreshold: number; // 0 to 255
}

export interface CropBox {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  width: number; // normalized 0..1
  height: number; // normalized 0..1
}

export interface Point2D {
  x: number;
  y: number;
}

// 4 quadrilateral corners for perspective correction in normalized coordinates [0..1]
// order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
export type QuadPoints = [Point2D, Point2D, Point2D, Point2D];

export interface DocumentLayer {
  id: string;
  name: string;
  src: string; // Base64 or Blob Data URL
  originalWidth: number;
  originalHeight: number;
  x: number; // mm from top-left of page
  y: number; // mm from top-left of page
  width: number; // mm
  height: number; // mm
  rotation: number; // degrees
  locked: boolean;
  visible: boolean;
  aspectRatioLocked: boolean;
  crop: CropBox | null;
  perspectivePoints: QuadPoints | null;
  adjustments: ImageAdjustments;
  // Cache for rendered canvas of this layer after crop, perspective, and adjustments
  renderedPreviewUrl?: string;
}

export interface Page {
  id: string;
  name: string;
  paperSize: PaperSize;
  orientation: Orientation;
  customWidthMm?: number;
  customHeightMm?: number;
  backgroundColor: string; // e.g. '#FFFFFF'
  layers: DocumentLayer[];
}

export interface ProjectSettings {
  unit: MeasurementUnit;
  defaultDpi: 72 | 150 | 300 | 600;
  gridEnabled: boolean;
  gridSpacingMm: number;
  guidesEnabled: boolean;
  safeMarginMm: number;
  snapToGrid: boolean;
  snapToCenter: boolean;
  snapToEdges: boolean;
  snapToGuides: boolean;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  unit: 'mm',
  defaultDpi: 300,
  gridEnabled: false,
  gridSpacingMm: 10,
  guidesEnabled: true,
  safeMarginMm: 10,
  snapToGrid: false,
  snapToCenter: true,
  snapToEdges: true,
  snapToGuides: true,
};

export interface Project {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  pages: Page[];
  settings: ProjectSettings;
  guides: {
    horizontal: number[]; // mm from top
    vertical: number[]; // mm from left
  };
}

export type PresetWorkflowType = 'front-back' | 'single' | 'multi-page' | 'blank';
export type FrontBackPresetLayout = 'front-above-back' | 'front-beside-back' | 'centered' | 'top-left-top-right' | 'custom';
export type SingleDocPresetFit = 'fit-a4' | 'fit-width' | 'fit-height' | 'original-ratio' | 'center-page' | 'custom';
