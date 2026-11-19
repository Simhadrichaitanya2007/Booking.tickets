import React from 'react';
import { Check, Lock, UserCheck } from 'lucide-react';
import { CLASS_METADATA } from '../data/railDataset';
import { CoachSeat, TravelClass } from '../types/rail';

interface CoachSeatMapProps {
  coaches: string[];
  activeCoach: string;
  onChangeCoach: (coachId: string) => void;
  seats: CoachSeat[];
  selectedSeats: CoachSeat[];
  maxSeats: number;
  travelClass: TravelClass;
  onToggleSeat: (seat: CoachSeat) => void;
}

export const CoachSeatMap: React.FC<CoachSeatMapProps> = ({
  coaches,
  activeCoach,
  onChangeCoach,
  seats,
  selectedSeats,
  maxSeats,
  travelClass,
  onToggleSeat,
}) => {
  const selectedIds = new Set(selectedSeats.map((s) => `${s.coachId}-${s.seatNumber}`));

  // Group seats by bay or row
  const bays = new Map<number, CoachSeat[]>();
  seats.forEach((seat) => {
    const group = bays.get(seat.bayNumber) || [];
    group.push(seat);
    bays.set(seat.bayNumber, group);
  });

  const renderSeatButton = (seat: CoachSeat) => {
    const key = `${seat.coachId}-${seat.seatNumber}`;
    const isSelected = selectedIds.has(key);
    const isBooked = seat.status === 'booked';

    return (
      <button
        key={key}
        type="button"
        disabled={isBooked}
        onClick={() => onToggleSeat(seat)}
        aria-label={`Seat ${seat.seatNumber} ${seat.berthCode}, ${
          isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'
        }`}
        aria-pressed={isSelected}
        className={`relative px-2 py-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-w-[54px] min-h-[54px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
          isBooked
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isSelected
              ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white shadow-md scale-[1.02]'
              : 'bg-white border-sky-200 text-[#0B1F3A] hover:border-sky-500 hover:bg-sky-50'
        }`}
      >
        <span className="font-mono text-xs font-bold tabular-nums">{seat.seatNumber}</span>
        <span
          className={`text-[10px] font-semibold mt-0.5 ${
            isBooked ? 'text-slate-400' : isSelected ? 'text-sky-300' : 'text-sky-700'
          }`}
        >
          {seat.berthCode}
        </span>
        {isSelected && (
          <Check className="w-3 h-3 text-sky-300 absolute top-1 right-1" aria-hidden="true" />
        )}
        {isBooked && (
          <Lock className="w-2.5 h-2.5 text-slate-400 absolute top-1 right-1" aria-hidden="true" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Coach Selector & Quota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 mr-1">Coach:</span>
          {coaches.map((coachId) => (
            <button
              key={coachId}
              type="button"
              onClick={() => onChangeCoach(coachId)}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                activeCoach === coachId
                  ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {coachId}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl tabular-nums">
          <UserCheck className="w-4 h-4 text-sky-600" aria-hidden="true" />
          <span>
            Selected {selectedSeats.length} of {maxSeats} required seat{maxSeats > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Class Layout Info & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs">
        <span className="text-slate-600 font-medium">
          {CLASS_METADATA[travelClass].layoutSummary}
        </span>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <span className="w-4 h-4 rounded border border-sky-300 bg-white inline-block" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <span className="w-4 h-4 rounded bg-[#0B1F3A] inline-flex items-center justify-center text-white">
              <Check className="w-2.5 h-2.5" aria-hidden="true" />
            </span>
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="w-4 h-4 rounded border border-slate-200 bg-slate-100 inline-flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-slate-400" aria-hidden="true" />
            </span>
            Booked (Demo)
          </span>
        </div>
      </div>

      {/* Coach Bay Grid */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 overflow-x-auto">
        <div className="min-w-[460px] space-y-3">
          {Array.from(bays.entries()).map(([bayNumber, baySeats]) => {
            if (travelClass === TravelClass.CC) {
              const leftThree = baySeats.slice(0, 3);
              const rightTwo = baySeats.slice(3, 5);
              return (
                <div
                  key={bayNumber}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4"
                >
                  <span className="font-mono text-[11px] font-semibold text-slate-400 w-12 shrink-0">
                    Row {bayNumber}
                  </span>
                  <div className="flex items-center gap-2">{leftThree.map(renderSeatButton)}</div>
                  <div className="w-8 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
                    Aisle
                  </div>
                  <div className="flex items-center gap-2">{rightTwo.map(renderSeatButton)}</div>
                </div>
              );
            }

            if (travelClass === TravelClass.AC1) {
              const isCoupe = baySeats.length === 2;
              return (
                <div
                  key={bayNumber}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4"
                >
                  <span className="font-mono text-xs font-semibold text-slate-500 w-24 shrink-0">
                    {isCoupe ? `Coupe ${bayNumber}` : `Cabin ${bayNumber}`}
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {baySeats.map(renderSeatButton)}
                  </div>
                </div>
              );
            }

            if (travelClass === TravelClass.AC2) {
              const mainFour = baySeats.slice(0, 4);
              const sideTwo = baySeats.slice(4, 6);
              return (
                <div
                  key={bayNumber}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-400 w-11 shrink-0">
                      Bay {bayNumber}
                    </span>
                    <div className="grid grid-cols-2 gap-2">{mainFour.map(renderSeatButton)}</div>
                  </div>
                  <div className="h-16 w-px border-l border-dashed border-slate-300" />
                  <div className="flex flex-col gap-2">{sideTwo.map(renderSeatButton)}</div>
                </div>
              );
            }

            // SL or 3AC: 6 main berths (3x2) + aisle + 2 side berths
            const mainSix = baySeats.slice(0, 6);
            const sideTwo = baySeats.slice(6, 8);
            return (
              <div
                key={bayNumber}
                className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold text-slate-400 w-11 shrink-0">
                    Bay {bayNumber}
                  </span>
                  <div className="grid grid-cols-3 gap-2">{mainSix.map(renderSeatButton)}</div>
                </div>
                <div className="h-20 w-px border-l border-dashed border-slate-300" />
                <div className="flex flex-col gap-2">{sideTwo.map(renderSeatButton)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Berth Legend */}
      <p className="text-xs text-slate-500">
        Berth codes: LB = Lower, MB = Middle, UB = Upper, SL = Side Lower, SU = Side Upper, WS =
        Window Seat, MS = Middle Seat, AS = Aisle Seat.
      </p>
    </div>
  );
};
