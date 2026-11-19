export enum TravelClass {
  SL = 'SL',
  AC3 = '3AC',
  AC2 = '2AC',
  AC1 = '1AC',
  CC = 'CC',
}

export enum TrainType {
  VANDE_BHARAT = 'Vande Bharat',
  RAJDHANI = 'Rajdhani',
  SHATABDI = 'Shatabdi',
  DURONTO = 'Duronto',
  SUPERFAST = 'Superfast',
}

export enum BerthCode {
  LB = 'LB',
  MB = 'MB',
  UB = 'UB',
  SL = 'SL',
  SU = 'SU',
  WS = 'WS',
  MS = 'MS',
  AS = 'AS',
}

export type AppView =
  | 'home'
  | 'results'
  | 'booking'
  | 'ticket'
  | 'bookings'
  | 'offers'
  | 'contact';

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
}

export interface TrainClassOffer {
  travelClass: TravelClass;
  baseFare: number;
  demoSeatsLeft: number;
  availabilityLabel: string;
  coaches: string[];
}

export interface TrainRoute {
  id: string;
  trainNumber: string;
  trainName: string;
  trainType: TrainType;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  arrivalDayOffset: number;
  durationMinutes: number;
  distanceKm: number;
  runningDays: string[];
  classes: Record<TravelClass, TrainClassOffer | undefined>;
  highlights: string[];
  isCorridorGenerated?: boolean;
}

export interface SearchCriteria {
  fromCode: string;
  toCode: string;
  journeyDate: string;
  returnDate: string;
  travelClass: TravelClass;
  passengers: number;
  promoCode?: string;
}

export type DepartureWindow = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
export type SortOption = 'departure' | 'duration' | 'price';

export interface FilterState {
  departureWindow: DepartureWindow;
  maxPrice: number;
  trainTypes: TrainType[];
  selectedClasses: TravelClass[];
  sortBy: SortOption;
}

export interface CoachSeat {
  seatNumber: number;
  coachId: string;
  berthCode: BerthCode;
  bayNumber: number;
  status: 'available' | 'booked' | 'selected';
  label: string;
}

export interface PassengerInput {
  id: string;
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  berthPreference: 'No Preference' | 'Lower' | 'Middle' | 'Upper' | 'Side Lower' | 'Window';
  assignedCoach: string;
  assignedSeatNumber: number;
  assignedBerthCode: BerthCode;
}

export interface FareBreakdown {
  baseFarePerPassenger: number;
  passengerCount: number;
  subtotal: number;
  reservationFee: number;
  serviceGst: number;
  promoDiscount: number;
  appliedPromoCode?: string;
  totalDemoFare: number;
}

export interface DemoBooking {
  demoReference: string;
  status: 'CONFIRMED_DEMO' | 'CANCELLED_DEMO';
  createdAt: string;
  cancelledAt?: string;
  train: {
    trainNumber: string;
    trainName: string;
    trainType: TrainType;
    originCode: string;
    originName: string;
    originCity: string;
    destinationCode: string;
    destinationName: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime: string;
    arrivalDayOffset: number;
    durationMinutes: number;
  };
  journeyDate: string;
  returnDate?: string;
  travelClass: TravelClass;
  passengers: PassengerInput[];
  fareBreakdown: FareBreakdown;
  contactEmail: string;
  contactPhone: string;
  userId?: string;
}

export interface SavedTraveler {
  id: string;
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  berthPreference: PassengerInput['berthPreference'];
}

export interface DemoUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  savedTravelers: SavedTraveler[];
}

export interface DestinationGuide {
  id: string;
  city: string;
  stationCode: string;
  tagline: string;
  description: string;
  popularFromCode: string;
  sampleDuration: string;
  sampleStartingFare: number;
  imageUrl: string;
}

export interface PromoOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  maxDiscount: number;
  suggestedFromCode: string;
  suggestedToCode: string;
  suggestedClass: TravelClass;
  validityNote: string;
}
