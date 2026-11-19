import { PROMO_OFFERS, STATIONS, TRAIN_ROUTES } from '../data/railDataset';
import {
  BerthCode,
  CoachSeat,
  DemoBooking,
  DemoUser,
  FareBreakdown,
  SavedTraveler,
  SearchCriteria,
  Station,
  TrainRoute,
  TrainType,
  TravelClass,
} from '../types/rail';

/**
 * FUTURE AUTHORIZED RAILWAY API ADAPTER BOUNDARY
 * -----------------------------------------------------------------------------
 * AI Rail Journey isolates train discovery, seat inventory, and booking records
 * behind clean TypeScript interfaces (`IRailCatalogProvider` & `IBookingRepository`).
 *
 * When integrating with an authorized IRCTC / CRIS / B2B Rail API in production:
 * 1. Implement `AuthorizedRailApiProvider implements IRailCatalogProvider`
 *    forwarding search & coach composition calls through authenticated backend
 *    endpoints (/api/rail/search, /api/rail/availability).
 * 2. Replace `LocalPrototypeRailProvider` in the exported `railService` singleton.
 * 3. Replace `LocalStorageBookingRepository` with a persistent server database
 *    and authorized PNR webhook listener.
 */
export interface IRailCatalogProvider {
  getStations(): Station[];
  getStationByCode(code: string): Station | undefined;
  searchTrains(criteria: SearchCriteria): Promise<TrainRoute[]>;
  getCoachLayout(
    trainNumber: string,
    travelClass: TravelClass,
    journeyDate: string,
    coachId: string
  ): CoachSeat[];
  calculateFare(
    baseFare: number,
    passengers: number,
    travelClass: TravelClass,
    hasReturnTrip: boolean,
    promoCode?: string
  ): FareBreakdown;
}

export interface IBookingRepository {
  listBookings(): DemoBooking[];
  saveBooking(booking: DemoBooking): DemoBooking;
  cancelBooking(demoReference: string): DemoBooking | null;
  getBookedSeatsForCoach(
    trainNumber: string,
    journeyDate: string,
    coachId: string
  ): number[];
}

const BOOKINGS_STORAGE_KEY = 'ai_rail_journey_bookings_v1';
const USERS_STORAGE_KEY = 'ai_rail_journey_users_v1';
const SESSION_STORAGE_KEY = 'ai_rail_journey_session_v1';

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

export function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

class LocalStorageBookingRepository implements IBookingRepository {
  listBookings(): DemoBooking[] {
    try {
      const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as DemoBooking[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveBooking(booking: DemoBooking): DemoBooking {
    const existing = this.listBookings();
    const updated = [booking, ...existing];
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    return booking;
  }

  cancelBooking(demoReference: string): DemoBooking | null {
    const existing = this.listBookings();
    let cancelledItem: DemoBooking | null = null;
    const updated = existing.map((item) => {
      if (item.demoReference === demoReference && item.status !== 'CANCELLED_DEMO') {
        cancelledItem = {
          ...item,
          status: 'CANCELLED_DEMO',
          cancelledAt: new Date().toISOString(),
        };
        return cancelledItem;
      }
      return item;
    });
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    return cancelledItem;
  }

  getBookedSeatsForCoach(
    trainNumber: string,
    journeyDate: string,
    coachId: string
  ): number[] {
    const bookings = this.listBookings();
    const taken: number[] = [];
    for (const booking of bookings) {
      if (
        booking.status === 'CONFIRMED_DEMO' &&
        booking.train.trainNumber === trainNumber &&
        booking.journeyDate === journeyDate
      ) {
        for (const passenger of booking.passengers) {
          if (passenger.assignedCoach === coachId) {
            taken.push(passenger.assignedSeatNumber);
          }
        }
      }
    }
    return taken;
  }
}

class LocalPrototypeRailProvider implements IRailCatalogProvider {
  constructor(private readonly bookingRepo: IBookingRepository) {}

  getStations(): Station[] {
    return STATIONS;
  }

  getStationByCode(code: string): Station | undefined {
    return STATIONS.find((s) => s.code === code);
  }

  async searchTrains(criteria: SearchCriteria): Promise<TrainRoute[]> {
    // Small simulated async delay for realistic loading-state feedback
    await new Promise((resolve) => setTimeout(resolve, 260));

    const directMatches = TRAIN_ROUTES.filter(
      (route) =>
        route.originCode === criteria.fromCode && route.destinationCode === criteria.toCode
    );

    if (directMatches.length > 0) {
      return directMatches;
    }

    // Also synthesize realistic reverse/corridor prototype options when searching
    // any valid station pair not explicitly enumerated in the curated catalog
    const reverseMatches = TRAIN_ROUTES.filter(
      (route) =>
        route.originCode === criteria.toCode && route.destinationCode === criteria.fromCode
    ).map((reverse, idx) => ({
      ...reverse,
      id: `${reverse.trainNumber}-${criteria.fromCode}-${criteria.toCode}-rev`,
      trainNumber: String(Number(reverse.trainNumber) + (idx % 2 === 0 ? 1 : -1)),
      originCode: criteria.fromCode,
      destinationCode: criteria.toCode,
      departureTime: idx === 0 ? '07:15' : '20:40',
      arrivalTime: idx === 0 ? '18:30' : '08:10',
      arrivalDayOffset: idx === 0 ? 0 : 1,
    }));

    if (reverseMatches.length > 0) {
      return reverseMatches;
    }

    const fromStation = this.getStationByCode(criteria.fromCode);
    const toStation = this.getStationByCode(criteria.toCode);
    if (!fromStation || !toStation) return [];

    const seed = hashString(`${criteria.fromCode}-${criteria.toCode}`);
    const baseDist = 420 + (seed % 1100);
    const dur1 = Math.round((baseDist / 68) * 60);
    const dur2 = Math.round((baseDist / 84) * 60);

    const generatedCorridor: TrainRoute[] = [
      {
        id: `corridor-sf-${criteria.fromCode}-${criteria.toCode}`,
        trainNumber: String(12400 + (seed % 500)),
        trainName: `${fromStation.city}–${toStation.city} Superfast Express`,
        trainType: TrainType.SUPERFAST,
        originCode: criteria.fromCode,
        destinationCode: criteria.toCode,
        departureTime: '06:45',
        arrivalTime: `${String((6 + Math.floor(dur1 / 60)) % 24).padStart(2, '0')}:35`,
        arrivalDayOffset: dur1 >= 1020 ? 1 : 0,
        durationMinutes: dur1,
        distanceKm: baseDist,
        runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
          [TravelClass.SL]: {
            travelClass: TravelClass.SL,
            baseFare: Math.round(baseDist * 0.48),
            demoSeatsLeft: 38,
            availabilityLabel: 'AVL 38 (Demo)',
            coaches: ['S1', 'S2', 'S3'],
          },
          [TravelClass.AC3]: {
            travelClass: TravelClass.AC3,
            baseFare: Math.round(baseDist * 1.25),
            demoSeatsLeft: 24,
            availabilityLabel: 'AVL 24 (Demo)',
            coaches: ['B1', 'B2'],
          },
          [TravelClass.AC2]: {
            travelClass: TravelClass.AC2,
            baseFare: Math.round(baseDist * 1.78),
            demoSeatsLeft: 12,
            availabilityLabel: 'AVL 12 Fast Filling',
            coaches: ['A1'],
          },
          [TravelClass.AC1]: {
            travelClass: TravelClass.AC1,
            baseFare: Math.round(baseDist * 2.95),
            demoSeatsLeft: 5,
            availabilityLabel: 'AVL 5 Fast Filling',
            coaches: ['H1'],
          },
          [TravelClass.CC]: undefined,
        },
        highlights: ['Prototype Corridor Schedule', 'Full Sleeper & AC Tiers'],
        isCorridorGenerated: true,
      },
      {
        id: `corridor-vb-${criteria.fromCode}-${criteria.toCode}`,
        trainNumber: String(20800 + (seed % 190)),
        trainName: `${toStation.city} Intercity Express`,
        trainType: baseDist < 750 ? TrainType.VANDE_BHARAT : TrainType.DURONTO,
        originCode: criteria.fromCode,
        destinationCode: criteria.toCode,
        departureTime: '15:20',
        arrivalTime: `${String((15 + Math.floor(dur2 / 60)) % 24).padStart(2, '0')}:10`,
        arrivalDayOffset: dur2 >= 520 ? 1 : 0,
        durationMinutes: dur2,
        distanceKm: baseDist,
        runningDays: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
          [TravelClass.SL]:
            baseDist >= 750
              ? {
                  travelClass: TravelClass.SL,
                  baseFare: Math.round(baseDist * 0.52),
                  demoSeatsLeft: 31,
                  availabilityLabel: 'AVL 31 (Demo)',
                  coaches: ['S1', 'S2'],
                }
              : undefined,
          [TravelClass.AC3]: {
            travelClass: TravelClass.AC3,
            baseFare: Math.round(baseDist * 1.38),
            demoSeatsLeft: 20,
            availabilityLabel: 'AVL 20 (Demo)',
            coaches: ['B1', 'B2'],
          },
          [TravelClass.AC2]: {
            travelClass: TravelClass.AC2,
            baseFare: Math.round(baseDist * 1.92),
            demoSeatsLeft: 9,
            availabilityLabel: 'AVL 9 Fast Filling',
            coaches: ['A1'],
          },
          [TravelClass.AC1]: undefined,
          [TravelClass.CC]:
            baseDist < 750
              ? {
                  travelClass: TravelClass.CC,
                  baseFare: Math.round(baseDist * 2.1),
                  demoSeatsLeft: 42,
                  availabilityLabel: 'AVL 42 (Demo)',
                  coaches: ['C1', 'C2'],
                }
              : undefined,
        },
        highlights: ['Prototype Corridor Schedule', 'Fast Express'],
        isCorridorGenerated: true,
      },
    ];

    return generatedCorridor;
  }

  getCoachLayout(
    trainNumber: string,
    travelClass: TravelClass,
    journeyDate: string,
    coachId: string
  ): CoachSeat[] {
    const seats: CoachSeat[] = [];
    const locallyBooked = new Set(
      this.bookingRepo.getBookedSeatsForCoach(trainNumber, journeyDate, coachId)
    );
    const seedBase = hashString(`${trainNumber}-${travelClass}-${journeyDate}-${coachId}`);

    const isSeedBooked = (seatNum: number): boolean => {
      if (locallyBooked.has(seatNum)) return true;
      const val = ((seedBase + seatNum * 2654435761) >>> 0) % 100;
      return val < 34; // ~34% deterministic demo occupancy
    };

    if (travelClass === TravelClass.SL || travelClass === TravelClass.AC3) {
      // 4 bays x 8 berths = 32 interactive berths for clean ergonomic screen fit
      const bayPattern: BerthCode[] = [
        BerthCode.LB,
        BerthCode.MB,
        BerthCode.UB,
        BerthCode.LB,
        BerthCode.MB,
        BerthCode.UB,
        BerthCode.SL,
        BerthCode.SU,
      ];
      for (let bay = 1; bay <= 5; bay++) {
        for (let idx = 0; idx < 8; idx++) {
          const seatNumber = (bay - 1) * 8 + idx + 1;
          const berthCode = bayPattern[idx];
          seats.push({
            seatNumber,
            coachId,
            berthCode,
            bayNumber: bay,
            status: isSeedBooked(seatNumber) ? 'booked' : 'available',
            label: `${seatNumber} ${berthCode}`,
          });
        }
      }
      return seats;
    }

    if (travelClass === TravelClass.AC2) {
      // 5 bays x 6 berths = 30 berths
      const bayPattern: BerthCode[] = [
        BerthCode.LB,
        BerthCode.UB,
        BerthCode.LB,
        BerthCode.UB,
        BerthCode.SL,
        BerthCode.SU,
      ];
      for (let bay = 1; bay <= 5; bay++) {
        for (let idx = 0; idx < 6; idx++) {
          const seatNumber = (bay - 1) * 6 + idx + 1;
          const berthCode = bayPattern[idx];
          seats.push({
            seatNumber,
            coachId,
            berthCode,
            bayNumber: bay,
            status: isSeedBooked(seatNumber) ? 'booked' : 'available',
            label: `${seatNumber} ${berthCode}`,
          });
        }
      }
      return seats;
    }

    if (travelClass === TravelClass.AC1) {
      // 4 cabins/coupes: Cabins A, C, E (4 berths) and Coupe B (2 berths) = 18 berths
      const cabinSizes = [4, 2, 4, 4, 2];
      let seatCounter = 1;
      cabinSizes.forEach((size, cabinIdx) => {
        for (let i = 0; i < size; i++) {
          const berthCode = i % 2 === 0 ? BerthCode.LB : BerthCode.UB;
          seats.push({
            seatNumber: seatCounter,
            coachId,
            berthCode,
            bayNumber: cabinIdx + 1,
            status: isSeedBooked(seatCounter) ? 'booked' : 'available',
            label: `${seatCounter} ${berthCode}`,
          });
          seatCounter++;
        }
      });
      return seats;
    }

    // Chair Car (CC): 8 rows x 5 seats (3 + 2) = 40 seats
    const rowPattern: BerthCode[] = [
      BerthCode.WS,
      BerthCode.MS,
      BerthCode.AS,
      BerthCode.AS,
      BerthCode.WS,
    ];
    for (let row = 1; row <= 8; row++) {
      for (let col = 0; col < 5; col++) {
        const seatNumber = (row - 1) * 5 + col + 1;
        const berthCode = rowPattern[col];
        seats.push({
          seatNumber,
          coachId,
          berthCode,
          bayNumber: row,
          status: isSeedBooked(seatNumber) ? 'booked' : 'available',
          label: `${seatNumber} ${berthCode}`,
        });
      }
    }
    return seats;
  }

  calculateFare(
    baseFare: number,
    passengers: number,
    travelClass: TravelClass,
    hasReturnTrip: boolean,
    promoCode?: string
  ): FareBreakdown {
    const legMultiplier = hasReturnTrip ? 2 : 1;
    const subtotal = baseFare * passengers * legMultiplier;
    const reservationPerPax =
      travelClass === TravelClass.SL ? 20 : travelClass === TravelClass.CC ? 40 : 60;
    const reservationFee = reservationPerPax * passengers * legMultiplier;
    const serviceGst =
      travelClass === TravelClass.SL ? 0 : Math.round((subtotal + reservationFee) * 0.05);

    let promoDiscount = 0;
    let appliedPromoCode: string | undefined;
    if (promoCode) {
      const normalized = promoCode.trim().toUpperCase();
      const matched = PROMO_OFFERS.find((p) => p.code === normalized);
      if (matched) {
        promoDiscount = Math.min(
          matched.maxDiscount,
          Math.round((subtotal * matched.discountPercent) / 100)
        );
        appliedPromoCode = matched.code;
      }
    }

    const totalDemoFare = Math.max(0, subtotal + reservationFee + serviceGst - promoDiscount);
    return {
      baseFarePerPassenger: baseFare,
      passengerCount: passengers,
      subtotal,
      reservationFee,
      serviceGst,
      promoDiscount,
      appliedPromoCode,
      totalDemoFare,
    };
  }
}

class LocalStorageAuthRepository {
  getUsers(): DemoUser[] {
    try {
      const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as DemoUser[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: DemoUser[]): void {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  getCurrentUser(): DemoUser | null {
    try {
      const userId = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!userId) return null;
      return this.getUsers().find((u) => u.id === userId) || null;
    } catch {
      return null;
    }
  }

  signUp(fullName: string, email: string, password: string): DemoUser {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('A local demo account with this email already exists. Please log in.');
    }

    const newUser: DemoUser = {
      id: `user-${Date.now()}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash: String(hashString(password)),
      createdAt: new Date().toISOString(),
      savedTravelers: [
        {
          id: `trav-${Date.now()}`,
          name: fullName.trim(),
          age: '28',
          gender: 'Other',
          berthPreference: 'Lower',
        },
      ],
    };

    this.saveUsers([newUser, ...users]);
    window.localStorage.setItem(SESSION_STORAGE_KEY, newUser.id);
    return newUser;
  }

  login(email: string, password: string): DemoUser {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const matched = users.find((u) => u.email === normalizedEmail);
    if (!matched || matched.passwordHash !== String(hashString(password))) {
      throw new Error('Invalid email or password for this local demo account.');
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, matched.id);
    return matched;
  }

  loginInstantDemoUser(): DemoUser {
    const demoEmail = 'aarav.demo@airailjourney.local';
    const users = this.getUsers();
    const existing = users.find((u) => u.email === demoEmail);
    if (existing) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, existing.id);
      return existing;
    }

    const demoUser: DemoUser = {
      id: 'user-demo-aarav',
      fullName: 'Aarav Sharma (Demo)',
      email: demoEmail,
      passwordHash: String(hashString('demo-user')),
      createdAt: new Date().toISOString(),
      savedTravelers: [
        {
          id: 'trav-aarav',
          name: 'Aarav Sharma',
          age: '29',
          gender: 'Male',
          berthPreference: 'Side Lower',
        },
        {
          id: 'trav-meera',
          name: 'Meera Sharma',
          age: '58',
          gender: 'Female',
          berthPreference: 'Lower',
        },
      ],
    };
    this.saveUsers([demoUser, ...users]);
    window.localStorage.setItem(SESSION_STORAGE_KEY, demoUser.id);
    return demoUser;
  }

  logout(): void {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  addSavedTraveler(userId: string, traveler: Omit<SavedTraveler, 'id'>): DemoUser | null {
    const users = this.getUsers();
    let updatedUser: DemoUser | null = null;
    const next = users.map((u) => {
      if (u.id !== userId) return u;
      updatedUser = {
        ...u,
        savedTravelers: [
          ...u.savedTravelers,
          { ...traveler, id: `trav-${Date.now()}-${Math.floor(Math.random() * 1000)}` },
        ],
      };
      return updatedUser;
    });
    this.saveUsers(next);
    return updatedUser;
  }

  removeSavedTraveler(userId: string, travelerId: string): DemoUser | null {
    const users = this.getUsers();
    let updatedUser: DemoUser | null = null;
    const next = users.map((u) => {
      if (u.id !== userId) return u;
      updatedUser = {
        ...u,
        savedTravelers: u.savedTravelers.filter((t) => t.id !== travelerId),
      };
      return updatedUser;
    });
    this.saveUsers(next);
    return updatedUser;
  }
}

export function generateDemoReference(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `DEMO-ARJ-${digits}`;
}

export function downloadDemoTicketHtml(booking: DemoBooking): void {
  const passengerRows = booking.passengers
    .map(
      (p, idx) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${idx + 1}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${p.name}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${p.age} / ${p.gender}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${p.assignedCoach} - ${p.assignedSeatNumber} (${p.assignedBerthCode})</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${booking.status === 'CANCELLED_DEMO' ? 'CANCELLED (DEMO)' : 'CONFIRMED (DEMO)'}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${booking.demoReference} — AI Rail Journey Demo Ticket</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;padding:32px;">
  <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:16px;overflow:hidden;">
    <div style="background:#0b1f3a;color:#ffffff;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#38bdf8;">AI Rail Journey · Prototype E-Ticket</div>
        <h1 style="margin:6px 0 0;font-size:22px;">${booking.train.trainNumber} · ${booking.train.trainName}</h1>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#cbd5e1;">Demo Reference</div>
        <div style="font-family:monospace;font-size:18px;font-weight:700;color:#38bdf8;">${booking.demoReference}</div>
      </div>
    </div>
    <div style="background:#fef3c7;color:#92400e;padding:10px 28px;font-size:13px;font-weight:600;border-bottom:1px solid #fde68a;">
      PROTOTYPE DISCLAIMER: This is a local demo digital ticket created by AI Rail Journey. Not affiliated with IRCTC or Indian Railways and not valid for real travel.
    </div>
    <div style="padding:24px 28px;">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
        <div>
          <div style="font-size:12px;color:#64748b;">From</div>
          <div style="font-size:18px;font-weight:700;">${booking.train.originCity} (${booking.train.originCode})</div>
          <div style="font-size:14px;color:#334155;">Departs ${booking.train.departureTime} · ${booking.journeyDate}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:12px;color:#64748b;">Class & Duration</div>
          <div style="font-size:15px;font-weight:600;">${booking.travelClass} · ${formatDuration(booking.train.durationMinutes)}</div>
          ${booking.returnDate ? `<div style="font-size:12px;color:#0284c7;">Return Date: ${booking.returnDate}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:#64748b;">To</div>
          <div style="font-size:18px;font-weight:700;">${booking.train.destinationCity} (${booking.train.destinationCode})</div>
          <div style="font-size:14px;color:#334155;">Arrives ${booking.train.arrivalTime}</div>
        </div>
      </div>

      <h2 style="font-size:15px;margin:0 0 10px;">Passenger Manifest</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead>
          <tr style="background:#f1f5f9;text-align:left;">
            <th style="padding:10px;">#</th>
            <th style="padding:10px;">Name</th>
            <th style="padding:10px;">Age / Gender</th>
            <th style="padding:10px;">Coach & Berth</th>
            <th style="padding:10px;">Status</th>
          </tr>
        </thead>
        <tbody>${passengerRows}</tbody>
      </table>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>Base Fare (${booking.passengers.length} passenger${booking.passengers.length > 1 ? 's' : ''})</span>
          <span>${formatCurrencyINR(booking.fareBreakdown.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>Demo Reservation & GST</span>
          <span>${formatCurrencyINR(booking.fareBreakdown.reservationFee + booking.fareBreakdown.serviceGst)}</span>
        </div>
        ${
          booking.fareBreakdown.promoDiscount > 0
            ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#0284c7;">
                <span>Demo Promo (${booking.fareBreakdown.appliedPromoCode})</span>
                <span>-${formatCurrencyINR(booking.fareBreakdown.promoDiscount)}</span>
              </div>`
            : ''
        }
        <div style="display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:10px;margin-top:8px;font-weight:700;font-size:16px;">
          <span>Total Demo Fare (No Payment Collected)</span>
          <span>${formatCurrencyINR(booking.fareBreakdown.totalDemoFare)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${booking.demoReference}-AI-Rail-Journey.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const bookingRepository = new LocalStorageBookingRepository();
export const railService: IRailCatalogProvider = new LocalPrototypeRailProvider(bookingRepository);
export const authRepository = new LocalStorageAuthRepository();
