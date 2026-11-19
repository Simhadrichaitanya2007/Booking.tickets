import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  Ticket,
  TrainFront,
} from 'lucide-react';
import { CLASS_METADATA } from '../data/railDataset';
import {
  downloadDemoTicketHtml,
  formatCurrencyINR,
  formatDuration,
} from '../services/railService';
import { DemoBooking } from '../types/rail';

interface DemoTicketViewProps {
  booking: DemoBooking;
  onGoToBookings: () => void;
  onSearchAgain: () => void;
}

export const DemoTicketView: React.FC<DemoTicketViewProps> = ({
  booking,
  onGoToBookings,
  onSearchAgain,
}) => {
  const isCancelled = booking.status === 'CANCELLED_DEMO';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2
            className={`w-6 h-6 ${isCancelled ? 'text-rose-600' : 'text-emerald-600'}`}
            aria-hidden="true"
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
              {isCancelled ? 'Cancelled Demo Ticket' : 'Demo Digital Ticket Ready'}
            </h1>
            <p className="text-xs text-slate-500">
              Saved locally in your browser under My Bookings.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-[#0B1F3A] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <span>Print Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => downloadDemoTicketHtml(booking)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download Ticket</span>
          </button>
        </div>
      </div>

      {/* Printable Demo Ticket Card */}
      <article className="print-ticket-container bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Navy Ticket Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#132E53] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <TrainFront className="w-4 h-4" aria-hidden="true" />
              <span>AI Rail Journey · Prototype E-Ticket</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {booking.train.trainNumber} · {booking.train.trainName}
            </h2>
            <p className="text-xs text-slate-300">
              {booking.train.trainType} · {CLASS_METADATA[booking.travelClass].label}
            </p>
          </div>

          <div className="sm:text-right bg-white/10 border border-white/15 rounded-xl px-4 py-3">
            <div className="text-[11px] text-slate-300">Demo Reference (Not Live PNR)</div>
            <div className="font-mono text-lg font-bold text-sky-300 tabular-nums mt-0.5">
              {booking.demoReference}
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${
                isCancelled ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              {isCancelled ? 'CANCELLED (DEMO)' : 'CONFIRMED (DEMO)'}
            </div>
          </div>
        </div>

        {/* Prototype Warning Strip */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-medium text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>
            Prototype Demo Ticket — Not affiliated with IRCTC or Indian Railways and not valid for
            actual train travel.
          </span>
        </div>

        {/* Journey Route Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-200 items-center">
            <div>
              <div className="text-xs font-semibold text-slate-500">Departure</div>
              <div className="font-mono text-2xl font-bold text-[#0B1F3A] tabular-nums mt-1">
                {booking.train.departureTime}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                {booking.train.originCity} ({booking.train.originCode})
              </div>
              <div className="text-xs text-slate-500">{booking.train.originName}</div>
              <div className="text-xs font-mono text-sky-700 mt-1 tabular-nums">
                {booking.journeyDate}
              </div>
            </div>

            <div className="sm:text-center space-y-1.5">
              <div className="text-xs font-mono text-slate-500 tabular-nums">
                Duration: {formatDuration(booking.train.durationMinutes)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-12 bg-slate-300" />
                <Ticket className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span className="h-px w-12 bg-slate-300" />
              </div>
              {booking.returnDate && (
                <div className="text-xs font-medium text-sky-700 tabular-nums">
                  Return Leg: {booking.returnDate}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-semibold text-slate-500">Arrival</div>
              <div className="font-mono text-2xl font-bold text-[#0B1F3A] tabular-nums mt-1">
                {booking.train.arrivalTime}
                {booking.train.arrivalDayOffset > 0 && (
                  <span className="ml-1 text-xs text-sky-700">
                    +{booking.train.arrivalDayOffset}d
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                {booking.train.destinationCity} ({booking.train.destinationCode})
              </div>
              <div className="text-xs text-slate-500">{booking.train.destinationName}</div>
            </div>
          </div>

          {/* Passenger Table */}
          <div>
            <h3 className="font-display text-base font-bold text-[#0B1F3A] mb-3">
              Passenger Manifest ({booking.passengers.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Passenger Name</th>
                    <th className="px-4 py-3">Age / Gender</th>
                    <th className="px-4 py-3">Preference</th>
                    <th className="px-4 py-3">Coach &amp; Seat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {booking.passengers.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">
                        {p.age} yrs · {p.gender}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.berthPreference}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-sky-800 tabular-nums">
                        {p.assignedCoach} / {p.assignedSeatNumber} ({p.assignedBerthCode})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fare & Contact Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-[#0B1F3A] text-sm">Itinerary Contact</div>
              <div>Email: {booking.contactEmail}</div>
              <div className="tabular-nums">Mobile: +91 {booking.contactPhone}</div>
              <div className="tabular-nums text-slate-500">
                Created: {new Date(booking.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrencyINR(booking.fareBreakdown.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Demo Reservation &amp; GST</span>
                <span className="font-mono tabular-nums">
                  {formatCurrencyINR(
                    booking.fareBreakdown.reservationFee + booking.fareBreakdown.serviceGst
                  )}
                </span>
              </div>
              {booking.fareBreakdown.promoDiscount > 0 && (
                <div className="flex justify-between text-sky-700">
                  <span>Promo ({booking.fareBreakdown.appliedPromoCode})</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrencyINR(booking.fareBreakdown.promoDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#0B1F3A]">
                <span>Total Demo Fare (Unpaid Prototype)</span>
                <span className="font-mono tabular-nums">
                  {formatCurrencyINR(booking.fareBreakdown.totalDemoFare)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Post-Ticket Navigation */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSearchAgain}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-[#0B1F3A] transition-colors"
        >
          Book Another Demo Trip
        </button>
        <button
          type="button"
          onClick={onGoToBookings}
          className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
        >
          View All My Demo Bookings
        </button>
      </div>
    </div>
  );
};
