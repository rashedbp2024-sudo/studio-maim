import React, { useRef } from 'react';
import {
  ImagePlus,
  UploadCloud,
  FileCheck,
  CreditCard,
  FileText,
  Award,
  BookOpen
} from 'lucide-react';
import {
  generateSampleNidFront,
  generateSampleNidBack,
  generateSampleBirthRegistration,
  generateSampleCertificate,
  generateSamplePassportFront
} from '../utils/sampleDocuments';

interface AssetsSidebarProps {
  onImportFiles: (files: FileList | File[]) => void;
  onImportSample: (name: string, dataUrl: string) => void;
  onImportSampleNidPair: () => void;
}

export const AssetsSidebar: React.FC<AssetsSidebarProps> = ({
  onImportFiles,
  onImportSample,
  onImportSampleNidPair,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImportFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c20] text-neutral-300 select-none overflow-y-auto p-3 space-y-4">
      {/* File Drop & Browse Area */}
      <div>
        <div className="text-xs font-semibold text-neutral-200 mb-2 flex items-center gap-1.5">
          <ImagePlus className="w-4 h-4 text-emerald-400" />
          <span>Import Customer Photos</span>
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-lg p-4 text-center cursor-pointer bg-neutral-900/50 hover:bg-neutral-900 transition-all group"
        >
          <UploadCloud className="w-8 h-8 text-neutral-500 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
          <p className="text-xs font-medium text-neutral-200">
            Click to Browse or Drag Photos Here
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">
            JPG, PNG, WEBP, BMP • Preserves Original High Resolution
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/bmp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Preset Realistic Sample Documents for Print Shop Operator Testing */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="text-xs font-semibold text-neutral-200 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>Sample Document Photos</span>
          </span>
          <span className="text-[10px] text-neutral-500">1-Click Test</span>
        </div>
        <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
          Test print layout workflows immediately with realistic specimen documents:
        </p>

        <div className="space-y-2">
          {/* Quick NID Front + Back Pair on One Page */}
          <button
            onClick={onImportSampleNidPair}
            className="w-full text-left p-2.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/40 hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-200">
                  NID Card (Front + Back)
                </div>
                <div className="text-[10px] text-neutral-400">
                  Imports both sides on the same A4 page as 2 independent layers (ISO 85.6×54mm)
                </div>
              </div>
            </div>
          </button>

          {/* Individual Samples */}
          <button
            onClick={() => onImportSample('NID Front.jpg', generateSampleNidFront())}
            className="w-full text-left p-2 rounded bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 transition-all flex items-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex-1 truncate">
              <div className="text-xs text-neutral-200 font-medium">NID Front Only</div>
              <div className="text-[10px] text-neutral-500">ISO 7810 ID Card Front Photo</div>
            </div>
          </button>

          <button
            onClick={() => onImportSample('NID Back.jpg', generateSampleNidBack())}
            className="w-full text-left p-2 rounded bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 transition-all flex items-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="flex-1 truncate">
              <div className="text-xs text-neutral-200 font-medium">NID Back Only</div>
              <div className="text-[10px] text-neutral-500">Address & Barcode Back Photo</div>
            </div>
          </button>

          <button
            onClick={() => onImportSample('Birth Registration.jpg', generateSampleBirthRegistration())}
            className="w-full text-left p-2 rounded bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 transition-all flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div className="flex-1 truncate">
              <div className="text-xs text-neutral-200 font-medium">Birth Registration</div>
              <div className="text-[10px] text-neutral-500">Full-Page Vertical Certificate</div>
            </div>
          </button>

          <button
            onClick={() => onImportSample('Degree Certificate.jpg', generateSampleCertificate())}
            className="w-full text-left p-2 rounded bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 transition-all flex items-center gap-2"
          >
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex-1 truncate">
              <div className="text-xs text-neutral-200 font-medium">Degree Certificate</div>
              <div className="text-[10px] text-neutral-500">Horizontal Academic Certificate</div>
            </div>
          </button>

          <button
            onClick={() => onImportSample('Passport Bio Page.jpg', generateSamplePassportFront())}
            className="w-full text-left p-2 rounded bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="flex-1 truncate">
              <div className="text-xs text-neutral-200 font-medium">Passport Bio Page</div>
              <div className="text-[10px] text-neutral-500">Standard Passport Specimen Photo</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
