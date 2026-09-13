import React from 'react';
import { HelpCircle, X, ShieldAlert, BookOpen, Keyboard, Printer } from 'lucide-react';
import { ID_CARD_DIMENSIONS } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#202024] border border-neutral-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm text-white">
              Operator Reference Manual & Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {/* Document Dimensions Reference Table */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-neutral-100 text-sm mb-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Standard Document Sizing Reference (Millimeters)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-neutral-800 rounded-lg overflow-hidden">
                <thead className="bg-[#18181b] text-neutral-400 border-b border-neutral-800 font-semibold">
                  <tr>
                    <th className="p-2">Document Type</th>
                    <th className="p-2">Width (mm)</th>
                    <th className="p-2">Height (mm)</th>
                    <th className="p-2">Standard Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono">
                  <tr className="hover:bg-neutral-800/40">
                    <td className="p-2 font-sans font-medium text-blue-300">
                      National ID (NID) / Smart Card
                    </td>
                    <td className="p-2">85.60 mm</td>
                    <td className="p-2">54.00 mm</td>
                    <td className="p-2 font-sans text-neutral-400">ISO/IEC 7810 ID-1</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40">
                    <td className="p-2 font-sans font-medium text-emerald-300">
                      Driving License / ATM Card
                    </td>
                    <td className="p-2">85.60 mm</td>
                    <td className="p-2">54.00 mm</td>
                    <td className="p-2 font-sans text-neutral-400">CR80 Standard</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40">
                    <td className="p-2 font-sans font-medium text-purple-300">
                      Standard Passport Photo
                    </td>
                    <td className="p-2">35.00 mm</td>
                    <td className="p-2">45.00 mm</td>
                    <td className="p-2 font-sans text-neutral-400">ICAO 9303</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40">
                    <td className="p-2 font-sans font-medium text-amber-300">
                      Birth Registration Certificate
                    </td>
                    <td className="p-2">190.00 mm</td>
                    <td className="p-2">270.00 mm</td>
                    <td className="p-2 font-sans text-neutral-400">Full A4 Portrait Print</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40">
                    <td className="p-2 font-sans font-medium text-cyan-300">
                      A4 Standard Paper Sheet
                    </td>
                    <td className="p-2">210.00 mm</td>
                    <td className="p-2">297.00 mm</td>
                    <td className="p-2 font-sans text-neutral-400">ISO 216</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-neutral-100 text-sm mb-2">
              <Keyboard className="w-4 h-4 text-blue-400" />
              <span>Desktop Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Print Document</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Ctrl + P
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Save Project (.dpls)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Undo Action</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Redo Action</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Ctrl + Y
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Nudge Layer (0.5 mm)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Arrow Keys
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Fast Nudge (5.0 mm)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Shift + Arrows
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Multi-Select Layers</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Shift / Ctrl + Click
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-800/50 border border-neutral-700/60">
                <span>Delete Selected Layer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-white">
                  Delete / Backspace
                </kbd>
              </div>
            </div>
          </div>

          {/* Compliance & Authenticity Policy */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-lg text-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Strict Print Shop Document Authenticity & Integrity Policy</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Document Print Layout Studio is strictly an optical layout, scaling, and printing preparation tool for genuine customer-provided document photos. In compliance with security standards, all document image processing is conducted entirely in local memory on the PC without external server transmission. Tools for altering, fabricating, rewriting, or forging official text, names, or numbers are strictly prohibited.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#18181b] border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
