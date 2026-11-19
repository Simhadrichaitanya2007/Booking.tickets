import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { CLASS_METADATA } from '../data/railDataset';
import {
  formatCurrencyINR,
  formatDuration,
  generateDemoReference,
  railService,
} from '../services/railService';
import {
  CoachSeat,
  DemoBooking,
  DemoUser,
  PassengerInput,
  SearchCriteria,
  TrainRoute,
  TravelClass,
} from '../types/rail';
import { CoachSeatMap } from './CoachSeatMap';

interface BookingFlowViewProps {
  train: TrainRoute;
  travelClass: TravelClass;
  criteria: SearchCriteria;
  currentUser: DemoUser | null;
  onBackToResults: () => void;
  onCompleteDemoBooking: (booking: DemoBooking) => void;
}

type PassengerFieldErrors = Record<
  string,
  {
    name?: string;
    age?: string;
  }
>;

function mapBerthToPreference(berthCode: string): PassengerInput['berthPreference'] {
  if (berthCode === 'LB') return 'Lower';
  if (berthCode === 'MB') return 'Middle';
  if (berthCode === 'UB') return 'Upper';
  if (berthCode === 'SL' || berthCode === 'SU') return 'Side Lower';
  if (berthCode === 'WS') return 'Window';
  return 'No Preference';
}

export const BookingFlowView: React.FC<BookingFlowViewProps> = ({
  train,
  travelClass,
  criteria,
  currentUser,
  onBackToResults,
  onCompleteDemoBooking,
}) => {
  const classOffer = train.classes[travelClass];
  const coaches = classOffer?.coaches || ['B1'];
  const [step, setStep] = useState<'seats' | 'passengers'>('seats');
  const [activeCoach, setActiveCoach] = useState<string>(coaches[0]);
  const [selectedSeats, setSelectedSeats] = useState<CoachSeat[]>([]);
  const [seatError, setSeatError] = useState<string | null>(null);

  const [passengers, setPassengers] = useState<PassengerInput[]>([]);
  const [contactEmail, setContactEmail] = useState<string>(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [paxErrors, setPaxErrors] = useState<PassengerFieldErrors>({});
  const [contactErrors, setContactErrors] = useState<{ email?: string; phone?: string }>({});

  const coachSeats = useMemo(
    () =>
      railService.getCoachLayout(
        train.trainNumber,
        travelClass,
        criteria.journeyDate,
        activeCoach
      ),
    [train.trainNumber, travelClass, criteria.journeyDate, activeCoach]
  );

  const fareBreakdown = useMemo(
    () =>
      railService.calculateFare(
        classOffer?.baseFare || 0,
        criteria.passengers,
        travelClass,
        Boolean(criteria.returnDate),
        criteria.promoCode
      ),
    [classOffer?.baseFare, criteria.passengers, travelClass, criteria.returnDate, criteria.promoCode]
  );

  useEffect(() => {
    setActiveCoach(coaches[0]);
    setSelectedSeats([]);
  }, [train.id, travelClass]);

  const handleToggleSeat = (seat: CoachSeat) => {
    setSeatError(null);
    const exists = selectedSeats.some(
      (s) => s.coachId === seat.coachId && s.seatNumber === seat.seatNumber
    );
    if (exists) {
      setSelectedSeats((prev) =>
        prev.filter((s) => !(s.coachId === seat.coachId && s.seatNumber === seat.seatNumber))
      );
      return;
    }

    if (selectedSeats.length >= criteria.passengers) {
      // Replace the oldest selected seat so users don't get stuck deselecting first
      setSelectedSeats((prev) => [...prev.slice(1), seat]);
      return;
    }

    setSelectedSeats((prev) => [...prev, seat]);
  };

  const handleProceedToPassengers = () => {
    if (selectedSeats.length !== criteria.passengers) {
      setSeatError(
        `Please select exactly ${criteria.passengers} seat${
          criteria.passengers > 1 ? 's' : ''
        } to match your traveler count.`
      );
      return;
    }
    setSeatError(null);

    // Preserve already entered names if returning from step 2, otherwise initialize cleanly
    const nextPassengers: PassengerInput[] = selectedSeats.map((seat, idx) => {
      const existing = passengers[idx];
      const saved = currentUser?.savedTravelers[idx];
      return {
        id: `pax-${idx + 1}`,
        name: existing?.name ?? saved?.name ?? '',
        age: existing?.age ?? saved?.age ?? '',
        gender: existing?.gender ?? saved?.gender ?? 'Male',
        berthPreference:
          existing?.berthPreference ??
          saved?.berthPreference ??
          mapBerthToPreference(seat.berthCode),
        assignedCoach: seat.coachId,
        assignedSeatNumber: seat.seatNumber,
        assignedBerthCode: seat.berthCode,
      };
    });

    setPassengers(nextPassengers);
    setStep('passengers');
  };

  const handleAutofillSavedTraveler = (paxIndex: number, travelerId: string) => {
    const saved = currentUser?.savedTravelers.find((t) => t.id === travelerId);
    if (!saved) return;
    setPassengers((prev) =>
      prev.map((p, idx) =>
        idx === paxIndex
          ? {
              ...p,
              name: saved.name,
              age: saved.age,
              gender: saved.gender,
              berthPreference: saved.berthPreference,
            }
          : p
      )
    );
    setPaxErrors((prev) => {
      const copy = { ...prev };
      delete copy[`pax-${paxIndex + 1}`];
      return copy;
    });
  };

  const handleConfirmDemoBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const nextPaxErrors: PassengerFieldErrors = {};
    let hasError = false;

    passengers.forEach((p) => {
      const err: { name?: string; age?: string } = {};
      if (!p.name.trim() || p.name.trim().length < 2) {
        err.name = 'Enter full name (min 2 characters).';
        hasError = true;
      }
      const ageNum = Number(p.age);
      if (!p.age.trim() || !Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        err.age = 'Enter valid age (1–120).';
        hasError = true;
      }
      if (err.name || err.age) {
        nextPaxErrors[p.id] = err;
      }
    });

    const nextContactErrors: { email?: string; phone?: string } = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactEmail.trim())) {
      nextContactErrors.email = 'Enter a valid email address for the demo itinerary.';
      hasError = true;
    }
    const cleanDigits = contactPhone.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      nextContactErrors.phone = 'Enter a 10-digit mobile number.';
      hasError = true;
    }

    setPaxErrors(nextPaxErrors);
    setContactErrors(nextContactErrors);
    if (hasError) return;

    const originStation = railService.getStationByCode(train.originCode);
    const destStation = railService.getStationByCode(train.destinationCode);

    const newBooking: DemoBooking = {
      demoReference: generateDemoReference(),
      status: 'CONFIRMED_DEMO',
      createdAt: new Date().toISOString(),
      train: {
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        trainType: train.trainType,
        originCode: train.originCode,
        originName: originStation?.name || train.originCode,
        originCity: originStation?.city || train.originCode,
        destinationCode: train.destinationCode,
        destinationName: destStation?.name || train.destinationCode,
        destinationCity: destStation?.city || train.destinationCode,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
        arrivalDayOffset: train.arrivalDayOffset,
        durationMinutes: train.durationMinutes,
      },
      journeyDate: criteria.journeyDate,
      returnDate: criteria.returnDate || undefined,
      travelClass,
      passengers,
      fareBreakdown,
      contactEmail: contactEmail.trim(),
      contactPhone: cleanDigits,
      userId: currentUser?.id,
    };

    onCompleteDemoBooking(newBooking);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={step === 'passengers' ? () => setStep('seats') : onBackToResults}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1F3A] hover:text-sky-700 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{step === 'passengers' ? 'Back to Coach Seat Selection' : 'Back to Train Results'}</span>
        </button>

        <ol className="flex items-center gap-3 text-xs font-semibold">
          <li
            className={`px-3 py-1.5 rounded-lg ${
              step === 'seats'
                ? 'bg-[#0B1F3A] text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            1. Select Seats
          </li>
          <span className="text-slate-300" aria-hidden="true">
            →
          </span>
          <li
            className={`px-3 py-1.5 rounded-lg ${
              step === 'passengers'
                ? 'bg-[#0B1F3A] text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            2. Passenger Details &amp; Demo Ticket
          </li>
        </ol>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Workspace */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          {step === 'seats' ? (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-semibold text-sky-700 mb-1">
                  #{train.trainNumber} · {CLASS_METADATA[travelClass].label}
                </p>
                <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
                  Choose Your Demo Coach &amp; Berths
                </h1>
              </div>

              <CoachSeatMap
                coaches={coaches}
                activeCoach={activeCoach}
                onChangeCoach={setActiveCoach}
                seats={coachSeats}
                selectedSeats={selectedSeats}
                maxSeats={criteria.passengers}
                travelClass={travelClass}
                onToggleSeat={handleToggleSeat}
              />

              {seatError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{seatError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedToPassengers}
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span>Continue to Passenger Details</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmDemoBooking} className="space-y-6" noValidate>
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-semibold text-sky-700 mb-1">
                  Step 2 of 2 · No Payment Details Collected
                </p>
                <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
                  Enter Passenger Information
                </h1>
              </div>

              {/* Dynamic Passenger Cards */}
              <div className="space-y-5">
                {passengers.map((pax, idx) => {
                  const err = paxErrors[pax.id] || {};
                  return (
                    <div
                      key={pax.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-[#0B1F3A]">
                            Passenger {idx + 1}
                          </span>
                          <span className="font-mono text-xs font-semibold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md">
                            {pax.assignedCoach} · Seat {pax.assignedSeatNumber} ({pax.assignedBerthCode})
                          </span>
                        </div>

                        {currentUser && currentUser.savedTravelers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                            <select
                              aria-label={`Autofill saved traveler for Passenger ${idx + 1}`}
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAutofillSavedTraveler(idx, e.target.value);
                                }
                              }}
                              className="text-xs font-medium text-[#0B1F3A] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                            >
                              <option value="">Autofill saved traveler...</option>
                              {currentUser.savedTravelers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.age}y)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                        <div className="sm:col-span-5">
                          <label
                            htmlFor={`${pax.id}-name`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Full Name *
                          </label>
                          <input
                            id={`${pax.id}-name`}
                            type="text"
                            value={pax.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPassengers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                              );
                            }}
                            placeholder="e.g. Ananya Verma"
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                              err.name ? 'border-rose-400' : 'border-slate-200'
                            }`}
                          />
                          {err.name && <p className="mt-1 text-xs text-rose-600">{err.name}</p>}
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`${pax.id}-age`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Age *
                          </label>
                          <input
                            id={`${pax.id}-age`}
                            type="number"
                            min={1}
                            max={120}
                            value={pax.age}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPassengers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, age: val } : item))
                              );
                            }}
                            placeholder="28"
                            className={`w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                              err.age ? 'border-rose-400' : 'border-slate-200'
                            }`}
                          />
                          {err.age && <p className="mt-1 text-xs text-rose-600">{err.age}</p>}
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`${pax.id}-gender`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Gender
                          </label>
                          <select
                            id={`${pax.id}-gender`}
                            value={pax.gender}
                            onChange={(e) => {
                              const val = e.target.value as PassengerInput['gender'];
                              setPassengers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, gender: val } : item))
                              );
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor={`${pax.id}-berth`}
                            className="block text-xs font-semibold text-slate-700 mb-1"
                          >
                            Berth Preference
                          </label>
                          <select
                            id={`${pax.id}-berth`}
                            value={pax.berthPreference}
                            onChange={(e) => {
                              const val = e.target.value as PassengerInput['berthPreference'];
                              setPassengers((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, berthPreference: val } : item
                                )
                              );
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="No Preference">No Preference</option>
                            <option value="Lower">Lower</option>
                            <option value="Middle">Middle</option>
                            <option value="Upper">Upper</option>
                            <option value="Side Lower">Side Lower</option>
                            <option value="Window">Window</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact Details for Demo Ticket */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                  Demo Ticket Contact Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        contactErrors.email ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {contactErrors.email && (
                      <p className="mt-1 text-xs text-rose-600">{contactErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      10-Digit Mobile Number *
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="9876543210"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        contactErrors.phone ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {contactErrors.phone && (
                      <p className="mt-1 text-xs text-rose-600">{contactErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Zero Payment Disclaimer */}
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 flex items-start gap-3 text-sm text-[#0B1F3A]">
                <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold">Zero Payment Prototype Mode:</span> No credit card,
                  UPI, or banking credentials are collected. Submitting generates a local demo
                  digital ticket stored only in your browser.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('seats')}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Change Seats
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Generate Demo Digital Ticket</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Sticky Summary */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="font-mono text-xs font-semibold text-sky-700">
              #{train.trainNumber} · {train.trainType}
            </div>
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] mt-0.5">
              {train.trainName}
            </h2>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                  {train.departureTime}
                </div>
                <div className="text-xs text-slate-500">{train.originCode}</div>
              </div>
              <div className="text-xs font-mono text-slate-500 tabular-nums">
                {formatDuration(train.durationMinutes)}
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                  {train.arrivalTime}
                </div>
                <div className="text-xs text-slate-500">{train.destinationCode}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 tabular-nums">
              <span>Date: {criteria.journeyDate}</span>
              {criteria.returnDate && (
                <>
                  <span aria-hidden="true" className="mx-1.5">
                    ·
                  </span>
                  <span className="text-sky-700 font-medium">Return: {criteria.returnDate}</span>
                </>
              )}
            </div>
          </div>

          {/* Selected Seats Chips */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 mb-2">
              Selected Demo Berths ({selectedSeats.length}/{criteria.passengers})
            </h3>
            {selectedSeats.length === 0 ? (
              <p className="text-xs text-slate-400">
                Select {criteria.passengers} seat{criteria.passengers > 1 ? 's' : ''} from the coach
                layout.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((s) => (
                  <span
                    key={`${s.coachId}-${s.seatNumber}`}
                    className="font-mono text-xs font-semibold bg-sky-50 text-[#0B1F3A] border border-sky-200 px-2.5 py-1 rounded-lg tabular-nums"
                  >
                    {s.coachId}-{s.seatNumber} ({s.berthCode})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sample Fare Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>
                Base Fare ({criteria.passengers} × {formatCurrencyINR(fareBreakdown.baseFarePerPassenger)}
                {criteria.returnDate ? ' × 2' : ''})
              </span>
              <span className="font-mono tabular-nums">
                {formatCurrencyINR(fareBreakdown.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Demo Reservation Charge</span>
              <span className="font-mono tabular-nums">
                {formatCurrencyINR(fareBreakdown.reservationFee)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated GST (5% AC)</span>
              <span className="font-mono tabular-nums">
                {formatCurrencyINR(fareBreakdown.serviceGst)}
              </span>
            </div>
            {fareBreakdown.promoDiscount > 0 && (
              <div className="flex justify-between text-sky-700 font-medium">
                <span>Demo Promo ({fareBreakdown.appliedPromoCode})</span>
                <span className="font-mono tabular-nums">
                  -{formatCurrencyINR(fareBreakdown.promoDiscount)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-display font-bold text-[#0B1F3A]">Total Demo Fare</span>
              <span className="font-mono text-xl font-bold text-[#0B1F3A] tabular-nums">
                {formatCurrencyINR(fareBreakdown.totalDemoFare)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
