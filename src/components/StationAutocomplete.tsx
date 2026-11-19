import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Station } from '../types/rail';

interface StationAutocompleteProps {
  id: string;
  label: string;
  stations: Station[];
  selectedCode: string;
  excludeCode?: string;
  onSelect: (code: string) => void;
}

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  id,
  label,
  stations,
  selectedCode,
  excludeCode,
  onSelect,
}) => {
  const selectedStation = stations.find((s) => s.code === selectedCode);
  const [query, setQuery] = useState(
    selectedStation ? `${selectedStation.city} (${selectedStation.code})` : ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const match = stations.find((s) => s.code === selectedCode);
    if (match && !isOpen) {
      setQuery(`${match.city} (${match.code})`);
    }
  }, [selectedCode, stations, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const match = stations.find((s) => s.code === selectedCode);
        if (match) {
          setQuery(`${match.city} (${match.code})`);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCode, stations]);

  const filteredStations = stations.filter((station) => {
    if (station.code === excludeCode) return false;
    if (!query.trim() || (selectedStation && query === `${selectedStation.city} (${selectedStation.code})`)) {
      return true;
    }
    const q = query.toLowerCase();
    return (
      station.city.toLowerCase().includes(q) ||
      station.name.toLowerCase().includes(q) ||
      station.code.toLowerCase().includes(q) ||
      station.state.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <MapPin
          className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          value={query}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search city or station code..."
          className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm font-medium text-slate-900 transition-colors"
        />
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 divide-y divide-slate-100"
        >
          {filteredStations.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              No matching stations found in prototype directory.
            </li>
          ) : (
            filteredStations.map((station) => (
              <li key={station.code}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(station.code);
                    setQuery(`${station.city} (${station.code})`);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-sky-50 transition-colors ${
                    station.code === selectedCode ? 'bg-sky-50/80' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {station.city}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {station.name} · {station.state}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md shrink-0">
                    {station.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
