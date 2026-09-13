import { jsPDF } from 'jspdf';
import { Page, Project, PaperSize } from '../types';
import { getPageDimensionsMm, renderPageToCanvas } from './imageProcessing';

/**
 * Maps our PaperSize to jsPDF recognized format string or custom dimensions [width, height] in mm
 */
function getJsPdfFormat(paperSize: PaperSize, widthMm: number, heightMm: number): string | [number, number] {
  switch (paperSize) {
    case 'A4':
    case 'A5':
    case 'A3':
      return paperSize.toLowerCase();
    case 'Letter':
      return 'letter';
    case 'Legal':
      return 'legal';
    default:
      return [widthMm, heightMm];
  }
}

export interface ExportPdfOptions {
  pagesToExport: Page[];
  dpi?: number; // default 300
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Exports project pages to high-resolution printable PDF
 */
export async function exportProjectToPdf(
  input: Project | ExportPdfOptions,
  optionalDpi?: number
): Promise<void> {
  let pagesToExport: Page[];
  let dpi = optionalDpi || 300;
  let filename = 'Document_Print_Layout.pdf';
  let onProgress: ((current: number, total: number) => void) | undefined;

  if ('pages' in input) {
    pagesToExport = input.pages;
    filename = `${input.name.replace(/\s+/g, '_')}_Print.pdf`;
  } else {
    pagesToExport = input.pagesToExport;
    if (input.dpi) dpi = input.dpi;
    if (input.filename) filename = input.filename;
    onProgress = input.onProgress;
  }

  if (pagesToExport.length === 0) return;

  // Initialize jsPDF with first page specs
  const firstPage = pagesToExport[0];
  const firstDims = getPageDimensionsMm(firstPage);
  const isLandscape = firstPage.orientation === 'landscape';

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: getJsPdfFormat(firstPage.paperSize, firstDims.widthMm, firstDims.heightMm),
    compress: true,
  });

  for (let i = 0; i < pagesToExport.length; i++) {
    const page = pagesToExport[i];
    const dims = getPageDimensionsMm(page);
    const pageLandscape = page.orientation === 'landscape';

    if (i > 0) {
      pdf.addPage(
        getJsPdfFormat(page.paperSize, dims.widthMm, dims.heightMm),
        pageLandscape ? 'landscape' : 'portrait'
      );
    }

    if (onProgress) onProgress(i + 1, pagesToExport.length);

    // Render page canvas at requested DPI (default 300 DPI)
    const pageCanvas = await renderPageToCanvas(page, dpi);
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);

    pdf.addImage(imgData, 'JPEG', 0, 0, dims.widthMm, dims.heightMm, undefined, 'FAST');
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Export single page as PNG or JPG image at 300 DPI
 */
export async function exportPageAsImage(
  page: Page,
  format: 'png' | 'jpeg' = 'png',
  dpi: number = 300,
  filename?: string
): Promise<void> {
  const canvas = await renderPageToCanvas(page, dpi);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mime, 0.95);

  const link = document.createElement('a');
  link.download = filename || `${page.name.replace(/\s+/g, '_')}_${dpi}dpi.${format}`;
  link.href = dataUrl;
  link.click();
}

/**
 * Isolated printing engine:
 * Renders pages onto high-res canvas at requested DPI, mounts in an isolated print frame
 * with exact 1:1 millimetric @page CSS rules, and executes the system print dialog.
 */
export async function printPages(
  input:
    | Page[]
    | {
        pagesToPrint: Page[];
        dpi?: number;
        grayscale?: boolean;
        onReady?: () => void;
      },
  optionalDpi?: number
): Promise<boolean> {
  let pagesToPrint: Page[];
  let dpi = optionalDpi || 300;
  let grayscale = false;
  let onReady: (() => void) | undefined;

  if (Array.isArray(input)) {
    pagesToPrint = input;
  } else {
    pagesToPrint = input.pagesToPrint;
    if (input.dpi) dpi = input.dpi;
    if (input.grayscale) grayscale = input.grayscale;
    onReady = input.onReady;
  }

  if (pagesToPrint.length === 0) return false;

  // Render all pages to high-res image data
  const pageImages: { dataUrl: string; widthMm: number; heightMm: number }[] = [];
  for (const page of pagesToPrint) {
    const dims = getPageDimensionsMm(page);
    const canvas = await renderPageToCanvas(page, dpi);
    pageImages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.96),
      widthMm: dims.widthMm,
      heightMm: dims.heightMm,
    });
  }

  if (onReady) onReady();

  // Remove existing print frame if any
  const oldFrame = document.getElementById('dpls-print-frame');
  if (oldFrame) oldFrame.remove();

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'dpls-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    throw new Error('Could not access print frame document.');
  }

  const pagesHtml = pageImages
    .map(
      (img, idx) => `
    <div class="print-page" style="width: ${img.widthMm}mm; height: ${img.heightMm}mm; ${
        idx < pageImages.length - 1 ? 'page-break-after: always; break-after: page;' : ''
      } ${grayscale ? 'filter: grayscale(100%);' : ''}">
      <img src="${img.dataUrl}" alt="Page ${idx + 1}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
    </div>`
    )
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Document Print Layout Studio - Print Job</title>
        <style>
          @page {
            size: auto;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page {
            position: relative;
            margin: 0 auto;
            padding: 0;
            overflow: hidden;
            background: #ffffff;
          }
          img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>
  `);
  doc.close();

  // Wait for all images inside iframe to be loaded
  await new Promise<void>((resolve) => {
    const imgs = doc.getElementsByTagName('img');
    let loaded = 0;
    const total = imgs.length;
    if (total === 0) {
      resolve();
      return;
    }
    const onImgComplete = () => {
      loaded++;
      if (loaded >= total) resolve();
    };
    for (let i = 0; i < total; i++) {
      if (imgs[i].complete) {
        loaded++;
      } else {
        imgs[i].onload = onImgComplete;
        imgs[i].onerror = onImgComplete;
      }
    }
    if (loaded >= total) resolve();
  });

  // Short pause for rasterization
  await new Promise((resolve) => setTimeout(resolve, 300));

  let printSucceeded = false;
  try {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    printSucceeded = true;
  } catch (err) {
    console.warn('Iframe print blocked or failed, attempting window.print fallback:', err);
    try {
      window.print();
      printSucceeded = true;
    } catch {
      printSucceeded = false;
    }
  }

  // Safely clean up iframe after delay
  setTimeout(() => {
    try {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    } catch {
      // ignore
    }
  }, 60000);

  return printSucceeded;
}

/**
 * Opens a dedicated standalone browser tab with the high-resolution pages and auto-prints.
 * Ideal for iframe environments or when popup printing is blocked.
 */
export async function openPrintTab(
  pagesToPrint: Page[],
  dpi: number = 300,
  grayscale: boolean = false
): Promise<void> {
  if (pagesToPrint.length === 0) return;

  const pageImages: { dataUrl: string; widthMm: number; heightMm: number }[] = [];
  for (const page of pagesToPrint) {
    const dims = getPageDimensionsMm(page);
    const canvas = await renderPageToCanvas(page, dpi);
    pageImages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.96),
      widthMm: dims.widthMm,
      heightMm: dims.heightMm,
    });
  }

  const pagesHtml = pageImages
    .map(
      (img, idx) => `
    <div class="print-page" style="width: ${img.widthMm}mm; height: ${img.heightMm}mm; ${
        idx < pageImages.length - 1 ? 'page-break-after: always; break-after: page;' : ''
      } ${grayscale ? 'filter: grayscale(100%);' : ''}">
      <img src="${img.dataUrl}" alt="Page ${idx + 1}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
    </div>`
    )
    .join('\n');

  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Document Print Layout Studio - 1:1 Scale Print</title>
    <style>
      @page {
        size: auto;
        margin: 0mm;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #f4f4f5;
        color: #000000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .no-print-bar {
        position: sticky;
        top: 0;
        background: #18181b;
        color: #ffffff;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .print-btn {
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 8px 18px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
      }
      .print-btn:hover {
        background: #1d4ed8;
      }
      .print-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0;
        gap: 20px;
      }
      .print-page {
        position: relative;
        margin: 0 auto;
        padding: 0;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      }
      img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .no-print-bar {
          display: none !important;
        }
        .print-container {
          padding: 0;
          gap: 0;
        }
        .print-page {
          box-shadow: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="no-print-bar">
      <div>
        <strong style="font-size: 15px;">Document Print Layout Studio</strong>
        <span style="opacity: 0.7; font-size: 12px; margin-left: 10px;">Exact 1:1 Scale Print Ready</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="font-size: 12px; color: #93c5fd;">Scale: 100% | Paper: A4</span>
        <button class="print-btn" onclick="window.print()">Print Now (প্রিন্ট করুন)</button>
      </div>
    </div>
    <div class="print-container">
      ${pagesHtml}
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    </script>
  </body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    // If popup blocked, create a temporary download link or redirect
    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

/**
 * Saves project to native .dpls file (JSON format)
 */
export function saveProjectToFile(project: Project): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/\s+/g, '_')}.dpls`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Loads project from .dpls file
 */
export function loadProjectFromFile(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const project = JSON.parse(text) as Project;
        if (!project.pages || !Array.isArray(project.pages)) {
          throw new Error('Invalid project file format: missing pages.');
        }
        resolve(project);
      } catch (err) {
        reject(new Error('Failed to parse .dpls project file: ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsText(file);
  });
}
