import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  Layers,
  FilePlus,
  X,
  ArrowRight,
  UploadCloud,
  Check,
  Sparkles
} from 'lucide-react';
import { PaperSize, Orientation, ID_CARD_DIMENSIONS } from '../types';
import {
  generateSampleNidFront,
  generateSampleNidBack,
  generateSampleBirthRegistration,
  generateSampleCertificate,
  generateSamplePassportFront
} from '../utils/sampleDocuments';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlankProject: (paperSize: PaperSize, orientation: Orientation) => void;
  onCreateFrontBackProject: (
    frontSrc: string,
    backSrc: string,
    preset: 'front-above-back' | 'front-beside-back' | 'centered' | 'top-left-top-right' | 'custom'
  ) => void;
  onCreateSingleDocProject: (
    docSrc: string,
    docName: string,
    preset: 'fit-a4' | 'fit-width' | 'fit-height' | 'original-ratio' | 'center-page'
  ) => void;
  onCreateMultiPageSampleProject: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateBlankProject,
  onCreateFrontBackProject,
  onCreateSingleDocProject,
  onCreateMultiPageSampleProject,
}) => {
  const [workflowTab, setWorkflowTab] = useState<'front-back' | 'single' | 'multipage' | 'blank'>('front-back');

  // Workflow A State
  const [frontBackPreset, setFrontBackPreset] = useState<
    'front-above-back' | 'front-beside-back' | 'centered' | 'top-left-top-right' | 'custom'
  >('front-above-back');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  // Workflow B State
  const [singleDocPreset, setSingleDocPreset] = useState<
    'fit-a4' | 'fit-width' | 'fit-height' | 'original-ratio' | 'center-page'
  >('original-ratio');
  const [singleImage, setSingleImage] = useState<string | null>(null);
  const [singleDocName, setSingleDocName] = useState<string>('Customer Document');

  // Blank Project State
  const [blankPaper, setBlankPaper] = useState<PaperSize>('A4');
  const [blankOrientation, setBlankOrientation] = useState<Orientation>('portrait');

  // Helpers for file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setter(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSampleNid = () => {
    setFrontImage(generateSampleNidFront());
    setBackImage(generateSampleNidBack());
  };

  const loadSampleBirthReg = () => {
    setSingleImage(generateSampleBirthRegistration());
    setSingleDocName('Birth Registration Certificate');
  };

  const loadSampleCert = () => {
    setSingleImage(generateSampleCertificate());
    setSingleDocName('University Degree Certificate');
  };

  const submitFrontBack = () => {
    const f = frontImage || generateSampleNidFront();
    const b = backImage || generateSampleNidBack();
    onCreateFrontBackProject(f, b, frontBackPreset);
    onClose();
  };

  const submitSingle = () => {
    const img = singleImage || generateSampleBirthRegistration();
    onCreateSingleDocProject(img, singleDocName, singleDocPreset);
    onClose();
  };

  const submitBlank = () => {
    onCreateBlankProject(blankPaper, blankOrientation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#202024] border border-neutral-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="font-semibold text-base text-white">New Print Layout Project</div>
            <div className="text-xs text-neutral-400">
              Select your customer document workflow to auto-configure paper and layers
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Selection Tabs */}
        <div className="grid grid-cols-4 bg-[#18181b] border-b border-neutral-800 text-xs">
          <button
            onClick={() => setWorkflowTab('front-back')}
            className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 font-medium transition-all ${
              workflowTab === 'front-back'
                ? 'border-blue-500 bg-blue-950/30 text-blue-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Workflow A: Front + Back</span>
          </button>

          <button
            onClick={() => setWorkflowTab('single')}
            className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 font-medium transition-all ${
              workflowTab === 'single'
                ? 'border-purple-500 bg-purple-950/30 text-purple-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Workflow B: Single Doc</span>
          </button>

          <button
            onClick={() => setWorkflowTab('multipage')}
            className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 font-medium transition-all ${
              workflowTab === 'multipage'
                ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workflow C: Multi-Page</span>
          </button>

          <button
            onClick={() => setWorkflowTab('blank')}
            className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 font-medium transition-all ${
              workflowTab === 'blank'
                ? 'border-neutral-400 bg-neutral-800 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>Blank Canvas</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* WORKFLOW A: FRONT + BACK */}
          {workflowTab === 'front-back' && (
            <div className="space-y-5">
              <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg text-xs text-blue-200">
                <span className="font-bold">Key Requirement:</span> Front and Back appear on the SAME A4 page as 2 independent, freely editable and movable layers (e.g. NID, Passport, ID Card, Driving License).
              </div>

              {/* Layout Presets */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Choose Initial Layout Preset on A4 (can still manually move anywhere after):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'front-above-back', label: 'Front Above Back', desc: 'Vertical Stack (Standard A4)' },
                    { id: 'front-beside-back', label: 'Front Beside Back', desc: 'Horizontal Side by Side' },
                    { id: 'centered', label: 'Both Centered', desc: 'Centered on Page' },
                    { id: 'custom', label: 'Custom Placement', desc: 'Manual positioning' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setFrontBackPreset(preset.id as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        frontBackPreset === preset.id
                          ? 'border-blue-500 bg-blue-600/20 text-white shadow'
                          : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Import Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Image */}
                <div className="border border-neutral-700 rounded-lg p-3 bg-neutral-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-200">1. Front Photo</span>
                    {frontImage && <span className="text-[10px] text-emerald-400">✓ Loaded</span>}
                  </div>
                  {frontImage ? (
                    <div className="h-32 rounded bg-black/40 border border-neutral-700 overflow-hidden relative group">
                      <img src={frontImage} alt="Front" className="w-full h-full object-contain" />
                      <button
                        onClick={() => setFrontImage(null)}
                        className="absolute top-1 right-1 p-1 bg-red-600 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="h-32 border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded flex flex-col items-center justify-center cursor-pointer p-2 transition-colors">
                      <UploadCloud className="w-6 h-6 text-neutral-500 mb-1" />
                      <span className="text-xs text-neutral-300">Click to Select Front.jpg</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setFrontImage)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Back Image */}
                <div className="border border-neutral-700 rounded-lg p-3 bg-neutral-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-200">2. Back Photo</span>
                    {backImage && <span className="text-[10px] text-emerald-400">✓ Loaded</span>}
                  </div>
                  {backImage ? (
                    <div className="h-32 rounded bg-black/40 border border-neutral-700 overflow-hidden relative group">
                      <img src={backImage} alt="Back" className="w-full h-full object-contain" />
                      <button
                        onClick={() => setBackImage(null)}
                        className="absolute top-1 right-1 p-1 bg-red-600 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="h-32 border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded flex flex-col items-center justify-center cursor-pointer p-2 transition-colors">
                      <UploadCloud className="w-6 h-6 text-neutral-500 mb-1" />
                      <span className="text-xs text-neutral-300">Click to Select Back.jpg</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setBackImage)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Quick Sample Button */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={loadSampleNid}
                  className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Sample NID Front & Back Photos</span>
                </button>
                <button
                  onClick={submitFrontBack}
                  className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <span>Create Front + Back A4 Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* WORKFLOW B: SINGLE DOCUMENT */}
          {workflowTab === 'single' && (
            <div className="space-y-5">
              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-lg text-xs text-purple-200">
                <span className="font-bold">Workflow B:</span> For Birth Registration, Birth Certificates, Degree Certificates, Trade Licenses, and other single-page documents.
              </div>

              {/* Document Name input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Document Type / Title
                </label>
                <input
                  type="text"
                  value={singleDocName}
                  onChange={(e) => setSingleDocName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Fit Presets */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  A4 Fitting Preset:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'original-ratio', label: 'Original Ratio', desc: 'Preserves exact aspect ratio' },
                    { id: 'fit-width', label: 'Fit to Width', desc: 'Fits page width (with margins)' },
                    { id: 'fit-a4', label: 'Fit to A4', desc: 'Scales to fill A4 printable area' },
                    { id: 'center-page', label: 'Center on Page', desc: 'Centered with original size' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSingleDocPreset(preset.id as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        singleDocPreset === preset.id
                          ? 'border-purple-500 bg-purple-600/20 text-white shadow'
                          : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image selector */}
              <div>
                {singleImage ? (
                  <div className="h-44 rounded bg-black/40 border border-neutral-700 overflow-hidden relative group flex items-center justify-center">
                    <img src={singleImage} alt="Document" className="max-h-full object-contain" />
                    <button
                      onClick={() => setSingleImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 rounded text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="h-44 border-2 border-dashed border-neutral-700 hover:border-purple-500 rounded-lg flex flex-col items-center justify-center cursor-pointer p-4 transition-colors">
                    <UploadCloud className="w-8 h-8 text-neutral-500 mb-2" />
                    <span className="text-xs font-medium text-neutral-200">
                      Click to Select Document Image (JPG, PNG, WEBP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setSingleImage)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Sample buttons */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={loadSampleBirthReg}
                    className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sample Birth Reg</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadSampleCert}
                    className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sample Certificate</span>
                  </button>
                </div>
                <button
                  onClick={submitSingle}
                  className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <span>Create Single A4 Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* WORKFLOW C: MULTI-PAGE PROJECT */}
          {workflowTab === 'multipage' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                <span className="font-bold">Workflow C (Multi-Page Mixed Project):</span> Supports customer jobs containing multiple distinct document types across separate A4 pages in one project file!
              </div>

              <div className="border border-neutral-700 rounded-lg p-3 bg-neutral-900/60 space-y-2 text-xs">
                <div className="font-semibold text-neutral-200">
                  Example Multi-Page Customer Job (Pre-populated for instant testing):
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                  <div className="p-2 rounded bg-neutral-800 border border-neutral-700">
                    <span className="font-mono text-blue-400 font-bold">Page 1:</span> NID Card (Front + Back on same page)
                  </div>
                  <div className="p-2 rounded bg-neutral-800 border border-neutral-700">
                    <span className="font-mono text-purple-400 font-bold">Page 2:</span> Birth Registration Certificate
                  </div>
                  <div className="p-2 rounded bg-neutral-800 border border-neutral-700">
                    <span className="font-mono text-amber-400 font-bold">Page 3:</span> Degree Certificate (Academic)
                  </div>
                  <div className="p-2 rounded bg-neutral-800 border border-neutral-700">
                    <span className="font-mono text-rose-400 font-bold">Page 4:</span> Passport Specimen
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 pt-1">
                  Each page has independent layers, reordering, duplicate/delete, and can be printed or exported to a multi-page PDF together.
                </p>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => {
                    onCreateMultiPageSampleProject();
                    onClose();
                  }}
                  className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create 4-Page Mixed Project</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* BLANK PROJECT */}
          {workflowTab === 'blank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Paper Size
                </label>
                <select
                  value={blankPaper}
                  onChange={(e) => setBlankPaper(e.target.value as PaperSize)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white outline-none"
                >
                  <option value="A4">A4 (210 × 297 mm) - Standard Print Shop Size</option>
                  <option value="A5">A5 (148 × 210 mm) - Half A4</option>
                  <option value="A3">A3 (297 × 420 mm) - Large Format</option>
                  <option value="Letter">US Letter (215.9 × 279.4 mm)</option>
                  <option value="Legal">US Legal (215.9 × 355.6 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setBlankOrientation('portrait')}
                    className={`py-2 rounded border font-medium ${
                      blankOrientation === 'portrait'
                        ? 'border-blue-500 bg-blue-600/20 text-white'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Portrait (Vertical)
                  </button>
                  <button
                    onClick={() => setBlankOrientation('landscape')}
                    className={`py-2 rounded border font-medium ${
                      blankOrientation === 'landscape'
                        ? 'border-blue-500 bg-blue-600/20 text-white'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Landscape (Horizontal)
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={submitBlank}
                  className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <span>Create Blank Project</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
