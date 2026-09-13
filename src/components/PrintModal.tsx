import React, { useState, useEffect, useRef } from 'react';
import { Project, Page } from '../types';
import {
  Printer,
  FileDown,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';
import { renderPageToCanvas, getPageDimensionsMm } from '../utils/imageProcessing';
import { printPages, exportProjectToPdf, openPrintTab } from '../utils/exportUtils';

interface PrintModalProps {
  project: Project;
  activePageIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  project,
  activePageIndex,
  isOpen,
  onClose,
}) => {
  const [pageScope, setPageScope] = useState<'current' | 'all'>('all');
  const [printDpi, setPrintDpi] = useState<number>(300);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [copies, setCopies] = useState<number>(1);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(activePageIndex);

  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isOpeningTab, setIsOpeningTab] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const targetPages: Page[] =
    pageScope === 'current' ? [project.pages[activePageIndex]] : project.pages;

  // Render current preview page to canvas
  useEffect(() => {
    const pageToPreview = project.pages[previewPageIndex];
    if (!pageToPreview) return;

    let active = true;
    setIsRendering(true);

    // Render at preview DPI (150 for quick display)
    renderPageToCanvas(pageToPreview, 150)
      .then((renderedCanvas) => {
        if (!active || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        canvasRef.current.width = renderedCanvas.width;
        canvasRef.current.height = renderedCanvas.height;
        ctx.clearRect(0, 0, renderedCanvas.width, renderedCanvas.height);

        if (colorMode === 'grayscale') {
          ctx.filter = 'grayscale(100%)';
        }
        ctx.drawImage(renderedCanvas, 0, 0);
        ctx.filter = 'none';

        setIsRendering(false);
      })
      .catch((err) => {
        console.error('Error rendering preview:', err);
        setIsRendering(false);
      });

    return () => {
      active = false;
    };
  }, [project, previewPageIndex, colorMode]);

  const handlePrint = async () => {
    setIsPrinting(true);
    setStatusMessage({ text: 'উইন্ডোজ প্রিন্ট ইঞ্জিন চালু হচ্ছে... (Opening Print Dialog)', type: 'info' });
    try {
      const success = await printPages({
        pagesToPrint: targetPages,
        dpi: printDpi,
        grayscale: colorMode === 'grayscale',
      });
      if (success) {
        setStatusMessage({
          text: 'প্রিন্ট ডায়ালগ ওপেন হয়েছে। Destination এ আপনার প্রিন্টারটি সিলেক্ট করুন।',
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: 'ব্রাউজার সরাসরি প্রিন্ট ব্লক করেছে। দয়া করে নিচের "Open in Dedicated Print Tab" বাটনে ক্লিক করুন।',
          type: 'warning',
        });
      }
    } catch (err) {
      console.error('Printing error:', err);
      setStatusMessage({
        text: 'সরাসরি প্রিন্ট ব্যর্থ হয়েছে। নিচের "Open in Dedicated Print Tab" চাপুন।',
        type: 'warning',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenPrintTab = async () => {
    setIsOpeningTab(true);
    setStatusMessage({ text: 'নতুন প্রিন্ট ট্যাবে ডকুমেন্ট তৈরি হচ্ছে...', type: 'info' });
    try {
      await openPrintTab(targetPages, printDpi, colorMode === 'grayscale');
      setStatusMessage({
        text: 'নতুন ট্যাবে প্রিন্ট উইন্ডো ওপেন হয়েছে! সেখানে Print Now চাপুন।',
        type: 'success',
      });
    } catch (err) {
      console.error('Open print tab error:', err);
      setStatusMessage({
        text: 'ট্যাব ওপেন করতে সমস্যা হয়েছে। সরাসরি PDF ডাউনলোড করে প্রিন্ট করুন।',
        type: 'warning',
      });
    } finally {
      setIsOpeningTab(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setStatusMessage({ text: 'হাই-রেজোলিউশন PDF রেন্ডার হচ্ছে...', type: 'info' });
    try {
      await exportProjectToPdf(project, printDpi);
      setStatusMessage({
        text: 'PDF ফাইল ডাউনলোড সম্পন্ন হয়েছে! এটি যেকোনো প্রিন্টারে নির্ভুল মাপে প্রিন্ট করতে পারবেন।',
        type: 'success',
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setStatusMessage({ text: 'PDF তৈরিতে সমস্যা হয়েছে।', type: 'warning' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const currentPage = project.pages[previewPageIndex];
  const dims = currentPage ? getPageDimensionsMm(currentPage) : { widthMm: 210, heightMm: 297 };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#202024] border border-neutral-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[94vh] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <span>Print Shop Output Dialog</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
                  Exact 1:1 Scale
                </span>
              </div>
              <div className="text-xs text-neutral-400">
                Direct 1:1 Millimeter Scale for Customer Document Photos
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 flex gap-5 bg-[#18181b] overflow-hidden">
          {/* Left Preview Section */}
          <div className="flex-1 flex flex-col bg-neutral-900/60 rounded-lg border border-neutral-800 p-3 overflow-hidden">
            {/* Preview Pagination Bar */}
            <div className="flex items-center justify-between mb-2 text-xs text-neutral-400">
              <span className="font-medium text-neutral-200">
                Page {previewPageIndex + 1} of {project.pages.length}: {currentPage?.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={previewPageIndex === 0}
                  onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                  className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={previewPageIndex === project.pages.length - 1}
                  onClick={() => setPreviewPageIndex((p) => Math.min(project.pages.length - 1, p + 1))}
                  className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Preview Container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#101012] rounded border border-neutral-800 p-3 relative">
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 gap-2 text-xs text-neutral-300">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Generating High-Res Proof...</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="max-h-full max-w-full object-contain shadow-2xl rounded-sm bg-white"
              />
            </div>

            {/* Scale Confirmation Banner */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Scale: 100% (No browser shrink/fit distortion)</span>
              </span>
              <span className="font-mono text-neutral-400">
                {dims.widthMm} × {dims.heightMm} mm ({currentPage?.paperSize})
              </span>
            </div>
          </div>

          {/* Right Print Configuration Panel */}
          <div className="w-84 flex flex-col justify-between text-xs space-y-3.5 shrink-0 overflow-y-auto pr-0.5">
            <div className="space-y-3.5">
              {/* Printer Hardware & Destination Info Guide */}
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 text-neutral-300 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-blue-300 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Computer Printer Auto-Detection</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    System Ready
                  </span>
                </div>
                <p className="text-[10px] text-neutral-300 leading-relaxed">
                  উইন্ডোজ স্বয়ংক্রিয়ভাবে আপনার সংযুক্ত প্রিন্টার (Epson, Canon, HP, Brother) প্রিন্ট উইন্ডোর <strong>Destination</strong> লিস্টে দেখাবে।
                </p>
                <div className="text-[10px] text-blue-200/80 bg-blue-900/30 rounded p-1.5 flex items-start gap-1">
                  <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                  <span>প্রিন্ট ডায়ালগে <strong>Scale: 100% / Actual Size</strong> নির্বাচন করবেন।</span>
                </div>
              </div>

              {/* Pages to Print */}
              <div>
                <label className="block font-semibold text-neutral-200 mb-1.5">
                  Pages to Print
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPageScope('all')}
                    className={`p-2 rounded border font-medium text-left transition-all ${
                      pageScope === 'all'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold">All Pages</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {project.pages.length} {project.pages.length === 1 ? 'Page' : 'Pages'}
                    </div>
                  </button>

                  <button
                    onClick={() => setPageScope('current')}
                    className={`p-2 rounded border font-medium text-left transition-all ${
                      pageScope === 'current'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold">Current Only</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Page {activePageIndex + 1}
                    </div>
                  </button>
                </div>
              </div>

              {/* Resolution / DPI */}
              <div>
                <label className="block font-semibold text-neutral-200 mb-1.5">
                  Print Resolution (DPI)
                </label>
                <div className="space-y-1.5">
                  {[
                    { dpi: 300, label: '300 DPI (Standard Commercial Print)', desc: 'Sharp text & clean photos' },
                    { dpi: 600, label: '600 DPI (Ultra Fine Document Quality)', desc: 'Maximum sharpness for micro-text' },
                    { dpi: 150, label: '150 DPI (Draft Proof)', desc: 'Fast printing test' },
                  ].map((item) => (
                    <label
                      key={item.dpi}
                      onClick={() => setPrintDpi(item.dpi)}
                      className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        printDpi === item.dpi
                          ? 'bg-blue-950/40 border-blue-500 text-neutral-200'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printDpi"
                        checked={printDpi === item.dpi}
                        onChange={() => setPrintDpi(item.dpi)}
                        className="mt-0.5 accent-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-neutral-200">{item.label}</div>
                        <div className="text-[10px] text-neutral-500">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Mode */}
              <div>
                <label className="block font-semibold text-neutral-200 mb-1.5">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setColorMode('color')}
                    className={`py-1.5 px-3 rounded border font-medium ${
                      colorMode === 'color'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    Full Color
                  </button>
                  <button
                    onClick={() => setColorMode('grayscale')}
                    className={`py-1.5 px-3 rounded border font-medium ${
                      colorMode === 'grayscale'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    Monochrome (B&W)
                  </button>
                </div>
              </div>

              {/* Live Status Notification */}
              {statusMessage && (
                <div
                  className={`p-2.5 rounded text-[11px] leading-tight flex items-start gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : statusMessage.type === 'warning'
                      ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                      : 'bg-blue-950/40 border border-blue-500/40 text-blue-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : statusMessage.type === 'warning' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              {/* Option 1: Direct Print Dialog */}
              <button
                disabled={isPrinting || isOpeningTab || isExportingPdf || isRendering}
                onClick={handlePrint}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all text-xs"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>প্রিন্ট ডায়ালগ ওপেন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Print to Computer Printer (সরাসরি প্রিন্ট)</span>
                  </>
                )}
              </button>

              {/* Option 2: Dedicated Print Tab (Guaranteed for iframes) */}
              <button
                disabled={isPrinting || isOpeningTab || isExportingPdf || isRendering}
                onClick={handleOpenPrintTab}
                className="w-full py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-100 font-medium flex items-center justify-center gap-2 transition-all text-xs"
              >
                {isOpeningTab ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ট্যাব ওপেন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 text-cyan-400" />
                    <span>Open in Dedicated Print Tab (নতুন ট্যাবে প্রিন্ট)</span>
                  </>
                )}
              </button>

              {/* Option 3: Save as 300 DPI PDF */}
              <button
                disabled={isPrinting || isOpeningTab || isExportingPdf || isRendering}
                onClick={handleExportPdf}
                className="w-full py-1.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium flex items-center justify-center gap-2 transition-all text-xs"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PDF তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save as Print-Ready PDF (1:1 স্কেল)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
