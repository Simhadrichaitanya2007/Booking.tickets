import React from 'react';
import { TrainFront } from 'lucide-react';
import { AppView } from '../types/rail';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="no-print bg-[#0B1F3A] text-slate-300 border-t border-sky-900/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <span className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
                <TrainFront className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                AI Rail Journey
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              A portfolio-grade Indian railway booking prototype built with React, TypeScript,
              Tailwind CSS, and clean service boundaries prepared for future authorized railway API
              integration.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-sky-300 transition-colors"
                >
                  Home &amp; Train Search
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('results')}
                  className="hover:text-sky-300 transition-colors"
                >
                  Sample Schedules
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('bookings')}
                  className="hover:text-sky-300 transition-colors"
                >
                  My Demo Bookings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('offers')}
                  className="hover:text-sky-300 transition-colors"
                >
                  Offers &amp; Destinations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-sky-300 transition-colors"
                >
                  Contact &amp; Architecture
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Prototype Notice
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This project is not connected to IRCTC or Indian Railways. No live train availability,
              PNR verification, real ticket booking, or payment processing takes place. Demo tickets
              are stored locally in browser storage.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} AI Rail Journey · Academic &amp; Portfolio Prototype</span>
          <span>Built for clean UX &amp; future authorized rail API readiness</span>
        </div>
      </div>
    </footer>
  );
};
