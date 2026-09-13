import { DocumentLayer, ImageAdjustments, Point2D, QuadPoints, Page, PAPER_DIMENSIONS } from '../types';

/**
 * Solves an 8x8 linear system using Gaussian elimination to find the 3x3 homography matrix
 * that maps destination rectangle points (0,0), (W,0), (W,H), (0,H) to source quad points.
 */
function getHomographyMatrix(srcQuad: Point2D[], dstQuad: Point2D[]): number[] | null {
  // A * h = b, where h is [h00, h01, h02, h10, h11, h12, h20, h21] with h22 = 1
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = dstQuad[i].x;
    const sy = dstQuad[i].y;
    const dx = srcQuad[i].x;
    const dy = srcQuad[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);

    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    const tmpA = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tmpA;

    const tmpB = b[i];
    b[i] = b[maxRow];
    b[maxRow] = tmpB;

    if (Math.abs(A[i][i]) < 1e-10) return null;

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      b[k] -= factor * b[i];
    }
  }

  const h: number[] = new Array(8);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) {
      sum -= A[i][j] * h[j];
    }
    h[i] = sum / A[i][i];
  }

  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/**
 * Loads an HTMLImageElement safely from src
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image file: ' + e));
    img.src = src;
  });
}

/**
 * Perspective unwarping (rectification) using backward homography sampling with bilinear interpolation.
 */
export function applyPerspectiveWarp(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  quad: QuadPoints,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const srcW = sourceImg.width;
  const srcH = sourceImg.height;

  // Convert normalized quad points to pixel coordinates
  const pixelQuad: Point2D[] = quad.map((pt) => ({
    x: pt.x * srcW,
    y: pt.y * srcH,
  }));

  // Estimate aspect ratio of the quadrilateral
  const topEdge = Math.hypot(pixelQuad[1].x - pixelQuad[0].x, pixelQuad[1].y - pixelQuad[0].y);
  const bottomEdge = Math.hypot(pixelQuad[2].x - pixelQuad[3].x, pixelQuad[2].y - pixelQuad[3].y);
  const leftEdge = Math.hypot(pixelQuad[3].x - pixelQuad[0].x, pixelQuad[3].y - pixelQuad[0].y);
  const rightEdge = Math.hypot(pixelQuad[2].x - pixelQuad[1].x, pixelQuad[2].y - pixelQuad[1].y);

  const avgW = (topEdge + bottomEdge) / 2;
  const avgH = (leftEdge + rightEdge) / 2;

  const dstW = Math.round(targetWidth || Math.max(100, avgW));
  const dstH = Math.round(targetHeight || Math.max(100, avgH));

  const dstQuad: Point2D[] = [
    { x: 0, y: 0 },
    { x: dstW, y: 0 },
    { x: dstW, y: dstH },
    { x: 0, y: dstH },
  ];

  // Homography from dst (output) -> src (input)
  const H = getHomographyMatrix(pixelQuad, dstQuad);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  srcCtx.drawImage(sourceImg, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcPixels = srcData.data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = dstW;
  outCanvas.height = dstH;
  const outCtx = outCanvas.getContext('2d')!;
  const outData = outCtx.createImageData(dstW, dstH);
  const outPixels = outData.data;

  if (!H) {
    outCtx.drawImage(sourceImg, 0, 0, dstW, dstH);
    return outCanvas;
  }

  // Backward mapping with bilinear interpolation
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const wPrime = H[6] * x + H[7] * y + H[8];
      const invW = 1.0 / (wPrime || 0.00001);
      const u = (H[0] * x + H[1] * y + H[2]) * invW;
      const v = (H[3] * x + H[4] * y + H[5]) * invW;

      if (u >= 0 && u < srcW - 1 && v >= 0 && v < srcH - 1) {
        const u0 = Math.floor(u);
        const v0 = Math.floor(v);
        const u1 = u0 + 1;
        const v1 = v0 + 1;
        const du = u - u0;
        const dv = v - v0;

        const i00 = (v0 * srcW + u0) * 4;
        const i10 = (v0 * srcW + u1) * 4;
        const i01 = (v1 * srcW + u0) * 4;
        const i11 = (v1 * srcW + u1) * 4;

        const outIdx = (y * dstW + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = srcPixels[i00 + c] * (1 - du) + srcPixels[i10 + c] * du;
          const bottom = srcPixels[i01 + c] * (1 - du) + srcPixels[i11 + c] * du;
          outPixels[outIdx + c] = Math.round(top * (1 - dv) + bottom * dv);
        }
        outPixels[outIdx + 3] = 255;
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

/**
 * Apply non-destructive crop and adjustments to a layer, returning an optimized canvas
 */
export async function renderProcessedLayerCanvas(layer: DocumentLayer): Promise<HTMLCanvasElement> {
  const img = await loadImage(layer.src);

  let currentCanvas: HTMLCanvasElement;

  // 1. Perspective correction if enabled
  if (layer.perspectivePoints) {
    currentCanvas = applyPerspectiveWarp(img, layer.perspectivePoints);
  } else {
    currentCanvas = document.createElement('canvas');
    currentCanvas.width = img.width;
    currentCanvas.height = img.height;
    const ctx = currentCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
  }

  // 2. Crop if enabled
  if (layer.crop) {
    const crop = layer.crop;
    const cw = Math.max(10, Math.round(crop.width * currentCanvas.width));
    const ch = Math.max(10, Math.round(crop.height * currentCanvas.height));
    const cx = Math.max(0, Math.min(currentCanvas.width - cw, Math.round(crop.x * currentCanvas.width)));
    const cy = Math.max(0, Math.min(currentCanvas.height - ch, Math.round(crop.y * currentCanvas.height)));

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cw;
    croppedCanvas.height = ch;
    const cCtx = croppedCanvas.getContext('2d')!;
    cCtx.drawImage(currentCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
    currentCanvas = croppedCanvas;
  }

  // 3. Image adjustments (brightness, contrast, saturation, sharpness, grayscale, B&W)
  applyAdjustmentsToCanvas(currentCanvas, layer.adjustments);

  return currentCanvas;
}

/**
 * Adjust canvas pixels in place: brightness, contrast, saturation, exposure, sharpness, grayscale, B&W
 */
export function applyAdjustmentsToCanvas(canvas: HTMLCanvasElement, adj: ImageAdjustments): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Precalculate factors
  const brightness = (adj.brightness / 100) * 255;
  const contrastFactor = adj.contrast === 0 ? 1 : Math.tan(((adj.contrast + 100) * Math.PI) / 400);
  const exposureMultiplier = Math.pow(2, adj.exposure / 50);
  const saturationFactor = 1 + adj.saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Exposure
    if (adj.exposure !== 0) {
      r *= exposureMultiplier;
      g *= exposureMultiplier;
      b *= exposureMultiplier;
    }

    // Brightness
    if (adj.brightness !== 0) {
      r += brightness;
      g += brightness;
      b += brightness;
    }

    // Contrast
    if (adj.contrast !== 0) {
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;
    }

    // Saturation
    if (adj.saturation !== 0 && !adj.grayscale && !adj.blackAndWhite) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;
    }

    // Grayscale
    if (adj.grayscale || adj.blackAndWhite) {
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      if (adj.blackAndWhite) {
        const threshold = adj.bwThreshold ?? 128;
        const bw = gray >= threshold ? 255 : 0;
        r = bw;
        g = bw;
        b = bw;
      } else {
        r = gray;
        g = gray;
        b = gray;
      }
    }

    // Clamp
    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);

  // Sharpness (Unsharp Mask Convolution)
  if (adj.sharpness > 0) {
    applySharpness(ctx, w, h, adj.sharpness / 100);
  }
}

/**
 * 3x3 Sharpen convolution kernel
 */
function applySharpness(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = imgData.data;
  const output = ctx.createImageData(w, h);
  const dst = output.data;

  // Unsharp mask: center = 1 + 4*k, neighbors = -k
  const k = amount * 0.5;
  const center = 1 + 4 * k;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        dst[idx] = src[idx];
        dst[idx + 1] = src[idx + 1];
        dst[idx + 2] = src[idx + 2];
        dst[idx + 3] = src[idx + 3];
        continue;
      }

      const up = ((y - 1) * w + x) * 4;
      const down = ((y + 1) * w + x) * 4;
      const left = (y * w + (x - 1)) * 4;
      const right = (y * w + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          src[idx + c] * center -
          (src[up + c] + src[down + c] + src[left + c] + src[right + c]) * k;
        dst[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

/**
 * Calculates page dimensions in millimeters taking into account orientation
 */
export function getPageDimensionsMm(page: Page): { widthMm: number; heightMm: number } {
  let base: { widthMm: number; heightMm: number };
  if (page.paperSize === 'Custom' && page.customWidthMm && page.customHeightMm) {
    base = { widthMm: page.customWidthMm, heightMm: page.customHeightMm };
  } else {
    base = PAPER_DIMENSIONS[page.paperSize] || PAPER_DIMENSIONS.A4;
  }

  if (page.orientation === 'landscape') {
    return {
      widthMm: Math.max(base.widthMm, base.heightMm),
      heightMm: Math.min(base.widthMm, base.heightMm),
    };
  } else {
    return {
      widthMm: Math.min(base.widthMm, base.heightMm),
      heightMm: Math.max(base.widthMm, base.heightMm),
    };
  }
}

/**
 * Calculates effective printing DPI of a layer at its current physical size on paper.
 */
export function calculateEffectiveDpi(layer: DocumentLayer): { dpi: number; warning: boolean } {
  const cropRatio = layer.crop ? layer.crop.width : 1;
  const effectivePixels = layer.originalWidth * cropRatio;
  const widthInches = layer.width / 25.4;
  if (widthInches <= 0) return { dpi: 300, warning: false };

  const dpi = Math.round(effectivePixels / widthInches);
  return {
    dpi,
    warning: dpi < 150,
  };
}

/**
 * Render complete page onto high-resolution canvas at requested DPI (e.g. 300 DPI)
 */
export async function renderPageToCanvas(page: Page, targetDpi: number = 300): Promise<HTMLCanvasElement> {
  const { widthMm, heightMm } = getPageDimensionsMm(page);
  const pxPerMm = targetDpi / 25.4;

  const canvasWidth = Math.round(widthMm * pxPerMm);
  const canvasHeight = Math.round(heightMm * pxPerMm);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = page.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Render layers in order (bottom to top)
  for (const layer of page.layers) {
    if (!layer.visible) continue;

    try {
      const processedCanvas = await renderProcessedLayerCanvas(layer);

      const layerX = layer.x * pxPerMm;
      const layerY = layer.y * pxPerMm;
      const layerW = layer.width * pxPerMm;
      const layerH = layer.height * pxPerMm;

      ctx.save();
      // Translate to center of layer for rotation
      const cx = layerX + layerW / 2;
      const cy = layerY + layerH / 2;

      ctx.translate(cx, cy);
      if (layer.rotation) {
        ctx.rotate((layer.rotation * Math.PI) / 180);
      }

      ctx.drawImage(processedCanvas, -layerW / 2, -layerH / 2, layerW, layerH);
      ctx.restore();
    } catch (err) {
      console.error('Error rendering layer ' + layer.name, err);
    }
  }

  return canvas;
}
