import React, { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { CLASS_METADATA } from '../data/railDataset';
import {
  downloadDemoTicketHtml,
  formatCurrencyINR,
  formatDuration,
} from '../services/railService';
import { DemoBooking } from '../types/rail';

interface MyBookingsViewProps {
  bookings: DemoBooking[];
  onViewTicket: (booking: DemoBooking) => void;
  onCancelBooking: (demoReference: string) => void;
  onExploreTrains: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  onViewTicket,
  onCancelBooking,
  onExploreTrains,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'CONFIRMED_DEMO' | 'CANCELLED_DEMO'>(
    'all'
  );
  const [query, setQuery] = useState('');
  const [confirmCancelRef, setConfirmCancelRef] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        b.demoReference.toLowerCase().includes(q) ||
        b.train.trainName.toLowerCase().includes(q) ||
        b.train.trainNumber.includes(q) ||
        b.train.originCity.toLowerCase().includes(q) ||
        b.train.destinationCity.toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, query]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-sky-700 mb-1">
            Local Browser Persistence (localStorage)
          </p>
          <h1 className="font-display text-3xl font-bold text-[#0B1F3A] tracking-tight">
            My Demo Bookings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspect, download, print, or cancel your saved prototype tickets. These records stay
            strictly inside your browser.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'CONFIRMED_DEMO', label: 'Confirmed' },
              { id: 'CANCELLED_DEMO', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setStatusFilter(tab.id as 'all' | 'CONFIRMED_DEMO' | 'CANCELLED_DEMO')
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference or city..."
              aria-label="Filter demo bookings"
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-sky-600/50 mx-auto" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-[#0B1F3A]">
            No demo bookings saved yet
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Search any route, select berths in our interactive coach layout, and generate a sample
            digital ticket to see it appear here.
          </p>
          <button
            type="button"
            onClick={onExploreTrains}
            className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
          >
            Search Trains
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            No matching demo bookings
          </h2>
          <p className="text-sm text-slate-500">
            Try clearing your search query or switching the status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED_DEMO';
            return (
              <article
                key={booking.demoReference}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-sky-700">
                      {booking.demoReference}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span
                      className={`font-semibold ${
                        isCancelled ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {isCancelled ? 'Cancelled (Demo)' : 'Confirmed (Demo)'}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      Journey {booking.journeyDate}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#0B1F3A]">
                    {booking.train.originCity} ({booking.train.originCode}) →{' '}
                    {booking.train.destinationCity} ({booking.train.destinationCode})
                  </h2>

                  <div className="text-sm text-slate-600 tabular-nums">
                    <span className="font-medium text-slate-800">
                      #{booking.train.trainNumber} {booking.train.trainName}
                    </span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300">
                      ·
                    </span>
                    <span>
                      {booking.train.departureTime}–{booking.train.arrivalTime} (
                      {formatDuration(booking.train.durationMinutes)})
                    </span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300">
                      ·
                    </span>
                    <span>{CLASS_METADATA[booking.travelClass].shortName}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300">
                      ·
                    </span>
                    <span>
                      {booking.passengers.length} traveler
                      {booking.passengers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  <div className="sm:text-right mr-2">
                    <div className="text-xs text-slate-500">Demo Fare</div>
                    <div className="font-mono text-lg font-bold text-[#0B1F3A] tabular-nums">
                      {formatCurrencyINR(booking.fareBreakdown.totalDemoFare)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewTicket(booking)}
                      className="px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>View Ticket</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadDemoTicketHtml(booking)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                      <span>Download</span>
                    </button>

                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelRef(booking.demoReference)}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cancel Demo</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancelRef && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="cancel-dialog-title" className="font-display text-lg font-bold text-[#0B1F3A]">
                Cancel Demo Booking?
              </h2>
              <button
                type="button"
                onClick={() => setConfirmCancelRef(null)}
                aria-label="Close confirmation dialog"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              This will mark prototype reference{' '}
              <span className="font-mono font-semibold text-[#0B1F3A]">{confirmCancelRef}</span> as
              cancelled in your local browser storage and release its demo seats.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelRef(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelBooking(confirmCancelRef);
                  setConfirmCancelRef(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
