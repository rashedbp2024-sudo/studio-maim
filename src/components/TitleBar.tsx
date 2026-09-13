import React from 'react';
import {
  Printer,
  Minus,
  Square,
  X,
  ShieldCheck,
  Maximize2,
  ExternalLink
} from 'lucide-react';

interface TitleBarProps {
  projectName: string;
  isDirty?: boolean;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onPrint: () => void;
  onExport: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  projectName,
  isDirty = false,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onPrint,
  onExport,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isInIframe, setIsInIframe] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="titlebar-container"
      className="h-9 bg-[#18181b] border-b border-neutral-800 flex items-center justify-between px-3 text-xs text-neutral-300 select-none z-50 shrink-0"
    >
      {/* Left: App Logo, Title, & Quick Project Name */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-100">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Printer className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide text-[13px] font-bold text-white">RBP COMPUTER</span>
        </div>
        <span className="text-neutral-600">|</span>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="font-medium text-neutral-200">{projectName || 'Untitled Project'}</span>
          {isDirty && <span className="text-amber-400 text-xs" title="Unsaved changes">●</span>}
          <span className="text-[11px] text-neutral-500 font-mono">(.dpls)</span>
        </div>
      </div>

      {/* Center: Privacy and Offline Badge */}
      <div className="hidden md:flex items-center gap-2 bg-neutral-900/80 border border-emerald-900/50 rounded-full px-3 py-0.5 text-[11px] text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>100% Local PC Processing • Customer Privacy Protected • Zero Cloud Uploads</span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center">
        {isInIframe && (
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2.5 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 transition-colors flex items-center gap-1 text-[11px] border-r border-neutral-800"
            title="Open in Full Browser Tab for Direct Hardware Printer Access"
          >
            <ExternalLink className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Open in New Tab</span>
          </a>
        )}
        <button
          id="btn-fullscreen-toggle"
          onClick={toggleFullscreen}
          className="h-8 px-3 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Window"}
        >
          {isFullscreen ? <Maximize2 className="w-3.5 h-3.5" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          id="btn-minimize-sim"
          onClick={() => {}}
          className="h-8 px-3 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-close-sim"
          onClick={() => {
            if (confirm("Close Document Print Layout Studio? Make sure to save your project first.")) {
              window.location.reload();
            }
          }}
          className="h-8 px-3 hover:bg-red-600 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
