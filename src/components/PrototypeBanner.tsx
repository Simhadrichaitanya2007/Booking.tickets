import React from 'react';
import { Info } from 'lucide-react';

export const PrototypeBanner: React.FC = () => {
  return (
    <div className="no-print bg-[#0B1F3A] text-slate-100 text-xs sm:text-sm py-2 px-4 border-b border-sky-900/50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <Info className="w-4 h-4 text-sky-400 shrink-0 hidden sm:block" aria-hidden="true" />
        <p className="leading-snug">
          <span className="font-semibold text-sky-300">Prototype Notice:</span>{' '}
          AI Rail Journey is a portfolio web prototype, not connected to IRCTC or Indian Railways.
          No live availability, real PNR checks, or payments are processed.
        </p>
      </div>
    </div>
  );
};
