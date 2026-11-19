import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrainFront,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CLASS_METADATA } from '../data/railDataset';
import { formatCurrencyINR, formatDuration, getTodayISO } from '../services/railService';
import {
  DepartureWindow,
  FilterState,
  SearchCriteria,
  SortOption,
  Station,
  TrainRoute,
  TrainType,
  TravelClass,
} from '../types/rail';
import { StationAutocomplete } from './StationAutocomplete';

interface TrainResultsViewProps {
  stations: Station[];
  criteria: SearchCriteria;
  trains: TrainRoute[];
  loading: boolean;
  onChangeCriteria: (next: SearchCriteria) => void;
  onRunSearch: (criteria: SearchCriteria) => void;
  onSelectTrainClass: (train: TrainRoute, travelClass: TravelClass) => void;
}

const ALL_TRAIN_TYPES = [
  TrainType.VANDE_BHARAT,
  TrainType.RAJDHANI,
  TrainType.SHATABDI,
  TrainType.DURONTO,
  TrainType.SUPERFAST,
];

const ALL_CLASSES = [
  TravelClass.SL,
  TravelClass.AC3,
  TravelClass.AC2,
  TravelClass.AC1,
  TravelClass.CC,
];

function getDepartureMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function matchesDepartureWindow(timeStr: string, window: DepartureWindow): boolean {
  if (window === 'all') return true;
  const mins = getDepartureMinutes(timeStr);
  if (window === 'morning') return mins >= 300 && mins < 720; // 05:00 - 11:59
  if (window === 'afternoon') return mins >= 720 && mins < 1020; // 12:00 - 16:59
  if (window === 'evening') return mins >= 1020 && mins < 1260; // 17:00 - 20:59
  return mins >= 1260 || mins < 300; // 21:00 - 04:59
}

function getLowestFare(train: TrainRoute, selectedClassFilter: TravelClass[]): number {
  const offers = Object.values(train.classes).filter(Boolean);
  const matching =
    selectedClassFilter.length > 0
      ? offers.filter((o) => o && selectedClassFilter.includes(o.travelClass))
      : offers;
  if (matching.length === 0) return Infinity;
  return Math.min(...matching.map((o) => o!.baseFare));
}

export const TrainResultsView: React.FC<TrainResultsViewProps> = ({
  stations,
  criteria,
  trains,
  loading,
  onChangeCriteria,
  onRunSearch,
  onSelectTrainClass,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    departureWindow: 'all',
    maxPrice: 7500,
    trainTypes: [],
    selectedClasses: [],
    sortBy: 'departure',
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [chosenClassPerTrain, setChosenClassPerTrain] = useState<Record<string, TravelClass>>({});

  useEffect(() => {
    setChosenClassPerTrain({});
  }, [trains]);

  const fromStation = stations.find((s) => s.code === criteria.fromCode);
  const toStation = stations.find((s) => s.code === criteria.toCode);
  const today = getTodayISO();

  const filteredTrains = useMemo(() => {
    const list = trains.filter((train) => {
      if (!matchesDepartureWindow(train.departureTime, filters.departureWindow)) {
        return false;
      }
      if (filters.trainTypes.length > 0 && !filters.trainTypes.includes(train.trainType)) {
        return false;
      }
      const availableClasses = Object.values(train.classes).filter(Boolean);
      if (filters.selectedClasses.length > 0) {
        const hasClass = availableClasses.some((o) =>
          filters.selectedClasses.includes(o!.travelClass)
        );
        if (!hasClass) return false;
      }
      const lowest = getLowestFare(train, filters.selectedClasses);
      if (lowest > filters.maxPrice) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sortBy === 'duration') {
        return a.durationMinutes - b.durationMinutes;
      }
      if (filters.sortBy === 'price') {
        return (
          getLowestFare(a, filters.selectedClasses) - getLowestFare(b, filters.selectedClasses)
        );
      }
      return getDepartureMinutes(a.departureTime) - getDepartureMinutes(b.departureTime);
    });
  }, [trains, filters]);

  const resetFilters = () => {
    setFilters({
      departureWindow: 'all',
      maxPrice: 7500,
      trainTypes: [],
      selectedClasses: [],
      sortBy: 'departure',
    });
  };

  const toggleTrainType = (type: TrainType) => {
    setFilters((prev) => ({
      ...prev,
      trainTypes: prev.trainTypes.includes(type)
        ? prev.trainTypes.filter((t) => t !== type)
        : [...prev.trainTypes, type],
    }));
  };

  const toggleClassFilter = (cls: TravelClass) => {
    setFilters((prev) => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(cls)
        ? prev.selectedClasses.filter((c) => c !== cls)
        : [...prev.selectedClasses, cls],
    }));
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (criteria.fromCode === criteria.toCode) {
      setSearchError('Origin and destination must be different.');
      return;
    }
    if (criteria.returnDate && criteria.returnDate < criteria.journeyDate) {
      setSearchError('Return date cannot precede departure date.');
      return;
    }
    setSearchError(null);
    onRunSearch(criteria);
  };

  const activeFilterCount =
    (filters.departureWindow !== 'all' ? 1 : 0) +
    (filters.maxPrice < 7500 ? 1 : 0) +
    filters.trainTypes.length +
    filters.selectedClasses.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Compact Inline Search Strip */}
      <form
        onSubmit={handleQuickSearch}
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <StationAutocomplete
              id="results-from"
              label="From"
              stations={stations}
              selectedCode={criteria.fromCode}
              excludeCode={criteria.toCode}
              onSelect={(code) => onChangeCriteria({ ...criteria, fromCode: code })}
            />
          </div>

          <div className="md:col-span-1 flex justify-center md:pb-1">
            <button
              type="button"
              onClick={() =>
                onChangeCriteria({
                  ...criteria,
                  fromCode: criteria.toCode,
                  toCode: criteria.fromCode,
                })
              }
              aria-label="Swap stations"
              className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 text-[#0B1F3A] flex items-center justify-center transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-3">
            <StationAutocomplete
              id="results-to"
              label="To"
              stations={stations}
              selectedCode={criteria.toCode}
              excludeCode={criteria.fromCode}
              onSelect={(code) => onChangeCriteria({ ...criteria, toCode: code })}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="results-date" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Departure
            </label>
            <input
              id="results-date"
              type="date"
              min={today}
              value={criteria.journeyDate}
              onChange={(e) => onChangeCriteria({ ...criteria, journeyDate: e.target.value })}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="results-pax" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Pax
            </label>
            <select
              id="results-pax"
              value={criteria.passengers}
              onChange={(e) =>
                onChangeCriteria({ ...criteria, passengers: Number(e.target.value) })
              }
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-semibold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Update Search</span>
            </button>
          </div>
        </div>
        {searchError && (
          <p role="alert" className="mt-3 text-sm text-rose-700 font-medium">
            {searchError}
          </p>
        )}
      </form>

      {/* Route Summary & Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            {fromStation?.city || criteria.fromCode} ({criteria.fromCode}) to{' '}
            {toStation?.city || criteria.toCode} ({criteria.toCode})
          </h1>
          <p className="text-sm text-slate-500 mt-1 tabular-nums">
            <span>{criteria.journeyDate}</span>
            {criteria.returnDate && (
              <>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span className="text-sky-700 font-medium">Return {criteria.returnDate}</span>
              </>
            )}
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span>
              {criteria.passengers} Passenger{criteria.passengers > 1 ? 's' : ''}
            </span>
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span>
              {filteredTrains.length} sample train{filteredTrains.length === 1 ? '' : 's'} shown
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0B1F3A]"
          >
            <Filter className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-trains" className="text-xs font-semibold text-slate-500">
              Sort:
            </label>
            <select
              id="sort-trains"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))
              }
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="departure">Earliest Departure</option>
              <option value="duration">Fastest Duration</option>
              <option value="price">Lowest Sample Fare</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Filter Rail + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 space-y-6 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Train search filters"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-display font-bold text-[#0B1F3A]">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" aria-hidden="true" />
              <span>Filter Trains</span>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-[#0B1F3A]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Departure Time */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2.5">Departure Window</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Any Time' },
                { id: 'morning', label: '05:00–12:00' },
                { id: 'afternoon', label: '12:00–17:00' },
                { id: 'evening', label: '17:00–21:00' },
                { id: 'night', label: '21:00–05:00' },
              ].map((win) => (
                <button
                  key={win.id}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      departureWindow: win.id as DepartureWindow,
                    }))
                  }
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-colors tabular-nums ${
                    filters.departureWindow === win.id
                      ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {win.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Fare */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-700">Max Sample Fare</h3>
              <span className="font-mono text-xs font-semibold text-sky-700 tabular-nums">
                {formatCurrencyINR(filters.maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={400}
              max={7500}
              step={100}
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
              }
              className="w-full accent-sky-600 cursor-pointer"
              aria-label="Maximum sample fare"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums mt-1">
              <span>₹400</span>
              <span>₹7,500</span>
            </div>
          </div>

          {/* Train Type */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2.5">Train Category</h3>
            <div className="space-y-2">
              {ALL_TRAIN_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.trainTypes.includes(type)}
                    onChange={() => toggleTrainType(type)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2.5">Travel Class</h3>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CLASSES.map((cls) => {
                const active = filters.selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleClassFilter(cls)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {CLASS_METADATA[cls].shortName}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Train Cards Column */}
        <div className="lg:col-span-9 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4"
                >
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-10 bg-slate-100 rounded w-full" />
                  <div className="h-16 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredTrains.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <TrainFront className="w-10 h-10 text-slate-300 mx-auto" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                No matching prototype trains
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your current filter combination excluded all trains on this route. Reset filters to
                restore sample schedules.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-sky-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            filteredTrains.map((train, index) => {
              const availableOffers = ALL_CLASSES.map((c) => train.classes[c]).filter(
                (offer): offer is NonNullable<typeof offer> => Boolean(offer)
              );
              const defaultOffer =
                availableOffers.find((o) => o.travelClass === criteria.travelClass) ||
                availableOffers[0];
              const activeClass =
                chosenClassPerTrain[train.id] || defaultOffer?.travelClass || TravelClass.AC3;
              const activeOffer = train.classes[activeClass] || defaultOffer;

              return (
                <motion.article
                  key={train.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-mono font-semibold text-sky-700">
                          #{train.trainNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#0B1F3A]">{train.trainType}</span>
                        <span aria-hidden="true">·</span>
                        <span>Runs: {train.runningDays.join(', ')}</span>
                      </div>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-[#0B1F3A]">
                        {train.trainName}
                      </h2>
                    </div>

                    <div className="text-xs text-slate-500">
                      {train.highlights.join(' · ')}
                    </div>
                  </div>

                  {/* Schedule Timeline Row */}
                  <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-4">
                      <div className="font-mono text-2xl font-bold text-[#0B1F3A] tabular-nums">
                        {train.departureTime}
                      </div>
                      <div className="text-sm font-medium text-slate-700 mt-0.5">
                        {fromStation?.city || train.originCode} ({train.originCode})
                      </div>
                    </div>

                    <div className="sm:col-span-4 flex flex-col items-center justify-center">
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 tabular-nums mb-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                        <span>{formatDuration(train.durationMinutes)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{train.distanceKm} km</span>
                      </div>
                      <div className="w-full flex items-center gap-2">
                        <span className="h-px flex-1 bg-slate-200" />
                        <TrainFront className="w-4 h-4 text-sky-600" aria-hidden="true" />
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                    </div>

                    <div className="sm:col-span-4 sm:text-right">
                      <div className="font-mono text-2xl font-bold text-[#0B1F3A] tabular-nums">
                        {train.arrivalTime}
                        {train.arrivalDayOffset > 0 && (
                          <span className="ml-1.5 text-xs font-semibold text-sky-700 align-top">
                            +{train.arrivalDayOffset}d
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-slate-700 mt-0.5">
                        {toStation?.city || train.destinationCode} ({train.destinationCode})
                      </div>
                    </div>
                  </div>

                  {/* Selectable Classes & CTA */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2.5">
                      {availableOffers.map((offer) => {
                        const isSelected = activeOffer?.travelClass === offer.travelClass;
                        return (
                          <button
                            key={offer.travelClass}
                            type="button"
                            onClick={() =>
                              setChosenClassPerTrain((prev) => ({
                                ...prev,
                                [train.id]: offer.travelClass,
                              }))
                            }
                            className={`px-3.5 py-2.5 rounded-xl border text-left transition-all min-w-[122px] ${
                              isSelected
                                ? 'border-sky-600 bg-sky-50/90 ring-1 ring-sky-600'
                                : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#0B1F3A]">
                                {CLASS_METADATA[offer.travelClass].shortName}
                              </span>
                              <span className="font-mono text-sm font-bold text-[#0B1F3A] tabular-nums">
                                {formatCurrencyINR(offer.baseFare)}
                              </span>
                            </div>
                            <div className="text-[11px] font-medium text-emerald-700 mt-1">
                              {offer.availabilityLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {activeOffer && (
                      <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                        <div className="text-left lg:text-right">
                          <div className="text-xs text-slate-500">
                            {criteria.passengers} × {CLASS_METADATA[activeOffer.travelClass].shortName}
                            {criteria.returnDate ? ' (Round trip)' : ''}
                          </div>
                          <div className="font-mono text-lg font-bold text-[#0B1F3A] tabular-nums">
                            {formatCurrencyINR(
                              activeOffer.baseFare *
                                criteria.passengers *
                                (criteria.returnDate ? 2 : 1)
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectTrainClass(train, activeOffer.travelClass)}
                          className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>Select Seats</span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
