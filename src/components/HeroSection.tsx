import React, { useState } from 'react';
import { ArrowLeftRight, Calendar, Search, Tag, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { CLASS_METADATA, HERO_IMAGE_URL } from '../data/railDataset';
import { getTodayISO } from '../services/railService';
import { SearchCriteria, Station, TravelClass } from '../types/rail';
import { StationAutocomplete } from './StationAutocomplete';

interface HeroSectionProps {
  stations: Station[];
  criteria: SearchCriteria;
  onChangeCriteria: (next: SearchCriteria) => void;
  onSearch: (criteria: SearchCriteria) => void;
}

const TRAVEL_CLASSES = [
  TravelClass.SL,
  TravelClass.AC3,
  TravelClass.AC2,
  TravelClass.AC1,
  TravelClass.CC,
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  stations,
  criteria,
  onChangeCriteria,
  onSearch,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const today = getTodayISO();

  const handleSwap = () => {
    setFormError(null);
    onChangeCriteria({
      ...criteria,
      fromCode: criteria.toCode,
      toCode: criteria.fromCode,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteria.fromCode || !criteria.toCode) {
      setFormError('Please select both origin and destination stations.');
      return;
    }
    if (criteria.fromCode === criteria.toCode) {
      setFormError('Origin and destination stations must be different.');
      return;
    }
    if (!criteria.journeyDate || criteria.journeyDate < today) {
      setFormError('Please choose today or a future journey date.');
      return;
    }
    if (criteria.returnDate && criteria.returnDate < criteria.journeyDate) {
      setFormError('Return date cannot be earlier than the departure date.');
      return;
    }
    setFormError(null);
    onSearch(criteria);
  };

  return (
    <section className="relative overflow-hidden bg-[#0B1F3A] text-white">
      {/* Background Photography with Measured Contrast Scrim */}
      <div className="absolute inset-0">
        {!imgFailed ? (
          <img
            src={HERO_IMAGE_URL}
            alt="Sleek Indian semi-high-speed express train crossing a scenic viaduct at sunrise"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-center opacity-50"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0B1F3A] via-[#132E53] to-sky-900" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#0B1F3A]/85 via-[#0B1F3A]/70 to-[#0B1F3A]/95"
          aria-hidden="true"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-24">
        {/* Hero Copy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-10"
        >
          <p className="text-sky-300 text-sm font-medium tracking-wide mb-3">
            Indian Rail Planning Prototype · Smart Corridor Search &amp; Interactive Coaches
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.08]"
            style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)' }}
          >
            Your Journey Begins Here
          </h1>
          <p className="mt-4 text-slate-200 text-base sm:text-lg max-w-2xl leading-relaxed">
            Explore India’s iconic express corridors, preview authentic coach berth layouts, and
            generate instant demo digital tickets guided by RailMate AI.
          </p>
        </motion.div>

        {/* Elevated Train Search Card */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSubmit}
          className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 p-5 sm:p-7"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* From Station */}
            <div className="lg:col-span-3">
              <StationAutocomplete
                id="hero-from-station"
                label="From Station"
                stations={stations}
                selectedCode={criteria.fromCode}
                excludeCode={criteria.toCode}
                onSelect={(code) => {
                  setFormError(null);
                  onChangeCriteria({ ...criteria, fromCode: code });
                }}
              />
            </div>

            {/* Swap Button */}
            <div className="lg:col-span-1 flex justify-center lg:pb-1">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination stations"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-[#0B1F3A] flex items-center justify-center transition-colors shadow-xs"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To Station */}
            <div className="lg:col-span-3">
              <StationAutocomplete
                id="hero-to-station"
                label="To Station"
                stations={stations}
                selectedCode={criteria.toCode}
                excludeCode={criteria.fromCode}
                onSelect={(code) => {
                  setFormError(null);
                  onChangeCriteria({ ...criteria, toCode: code });
                }}
              />
            </div>

            {/* Journey Date */}
            <div className="lg:col-span-2">
              <label
                htmlFor="hero-journey-date"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                Journey Date
              </label>
              <div className="relative">
                <Calendar
                  className="w-4 h-4 text-sky-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="hero-journey-date"
                  type="date"
                  min={today}
                  value={criteria.journeyDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setFormError(null);
                    onChangeCriteria({
                      ...criteria,
                      journeyDate: nextDate,
                      returnDate:
                        criteria.returnDate && criteria.returnDate < nextDate
                          ? ''
                          : criteria.returnDate,
                    });
                  }}
                  className="w-full pl-9 pr-2.5 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium text-slate-900 tabular-nums"
                />
              </div>
            </div>

            {/* Optional Return Date */}
            <div className="lg:col-span-2">
              <label
                htmlFor="hero-return-date"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                Return Date (Optional)
              </label>
              <div className="relative">
                <Calendar
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="hero-return-date"
                  type="date"
                  min={criteria.journeyDate || today}
                  value={criteria.returnDate}
                  onChange={(e) => {
                    setFormError(null);
                    onChangeCriteria({ ...criteria, returnDate: e.target.value });
                  }}
                  className="w-full pl-9 pr-2.5 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium text-slate-900 tabular-nums"
                />
              </div>
            </div>

            {/* Passengers */}
            <div className="lg:col-span-1">
              <label
                htmlFor="hero-passengers"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                Travelers
              </label>
              <div className="relative">
                <Users
                  className="w-4 h-4 text-sky-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <select
                  id="hero-passengers"
                  value={criteria.passengers}
                  onChange={(e) =>
                    onChangeCriteria({ ...criteria, passengers: Number(e.target.value) })
                  }
                  className="w-full pl-9 pr-2 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-900 tabular-nums"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Second Row: Class Segmented Controls + Optional Promo + Primary CTA */}
          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">Class:</span>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {TRAVEL_CLASSES.map((cls) => {
                  const active = criteria.travelClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => onChangeCriteria({ ...criteria, travelClass: cls })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#0B1F3A] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      {CLASS_METADATA[cls].shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Tag
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={criteria.promoCode || ''}
                  onChange={(e) =>
                    onChangeCriteria({ ...criteria, promoCode: e.target.value.toUpperCase() })
                  }
                  placeholder="Demo promo (e.g. COASTAL20)"
                  aria-label="Optional demo promo code"
                  className="w-full sm:w-52 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono uppercase tracking-wide text-slate-900 placeholder:normal-case placeholder:font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-sky-900/15 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                <span>Search Trains</span>
              </button>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="mt-4 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium"
            >
              {formError}
            </div>
          )}
        </motion.form>
      </div>
    </section>
  );
};
