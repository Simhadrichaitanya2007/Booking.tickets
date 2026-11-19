/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { BookingFlowView } from './components/BookingFlowView';
import { ContactArchitectureView } from './components/ContactArchitectureView';
import { DemoTicketView } from './components/DemoTicketView';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { MyBookingsView } from './components/MyBookingsView';
import { Navbar } from './components/Navbar';
import { OffersDestinationsSection } from './components/OffersDestinationsSection';
import { PrototypeBanner } from './components/PrototypeBanner';
import { RailMateAssistant } from './components/RailMateAssistant';
import { TrainResultsView } from './components/TrainResultsView';
import {
  authRepository,
  bookingRepository,
  getTomorrowISO,
  railService,
} from './services/railService';
import {
  AppView,
  DemoBooking,
  DemoUser,
  DestinationGuide,
  PromoOffer,
  SearchCriteria,
  TrainRoute,
  TravelClass,
} from './types/rail';

export default function App() {
  const stations = railService.getStations();
  const [activeView, setActiveView] = useState<AppView>('home');

  const [criteria, setCriteria] = useState<SearchCriteria>({
    fromCode: 'NDLS',
    toCode: 'MMCT',
    journeyDate: getTomorrowISO(),
    returnDate: '',
    travelClass: TravelClass.AC3,
    passengers: 1,
    promoCode: '',
  });

  const [trains, setTrains] = useState<TrainRoute[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(false);

  const [selectedTrain, setSelectedTrain] = useState<TrainRoute | null>(null);
  const [selectedClass, setSelectedClass] = useState<TravelClass>(TravelClass.AC3);
  const [activeTicket, setActiveTicket] = useState<DemoBooking | null>(null);

  const [bookings, setBookings] = useState<DemoBooking[]>(() => bookingRepository.listBookings());
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() =>
    authRepository.getCurrentUser()
  );

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const executeSearch = useCallback(async (nextCriteria: SearchCriteria) => {
    setCriteria(nextCriteria);
    setActiveView('results');
    setLoadingTrains(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const results = await railService.searchTrains(nextCriteria);
      setTrains(results);
    } finally {
      setLoadingTrains(false);
    }
  }, []);

  // Load initial sample results so navigating directly to Search Trains works immediately
  useEffect(() => {
    railService.searchTrains(criteria).then(setTrains);
  }, []);

  const handleNavigate = (view: AppView) => {
    if (view === 'results' && trains.length === 0) {
      executeSearch(criteria);
      return;
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTrainClass = (train: TrainRoute, travelClass: TravelClass) => {
    setSelectedTrain(train);
    setSelectedClass(travelClass);
    setActiveView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteDemoBooking = (newBooking: DemoBooking) => {
    bookingRepository.saveBooking(newBooking);
    setBookings(bookingRepository.listBookings());
    setActiveTicket(newBooking);
    setActiveView('ticket');
    showToast(`Demo ticket ${newBooking.demoReference} generated locally.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelBooking = (demoReference: string) => {
    const cancelled = bookingRepository.cancelBooking(demoReference);
    setBookings(bookingRepository.listBookings());
    if (activeTicket && activeTicket.demoReference === demoReference && cancelled) {
      setActiveTicket(cancelled);
    }
    showToast(`Demo booking ${demoReference} has been cancelled locally.`);
  };

  const handleSelectDestination = (dest: DestinationGuide) => {
    const nextCriteria: SearchCriteria = {
      ...criteria,
      fromCode: dest.popularFromCode,
      toCode: dest.stationCode,
    };
    executeSearch(nextCriteria);
  };

  const handleApplyOffer = (offer: PromoOffer) => {
    const nextCriteria: SearchCriteria = {
      ...criteria,
      fromCode: offer.suggestedFromCode,
      toCode: offer.suggestedToCode,
      travelClass: offer.suggestedClass,
      promoCode: offer.code,
    };
    showToast(`Applied demo promo code ${offer.code}.`);
    executeSearch(nextCriteria);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <PrototypeBanner />
        <Navbar
          activeView={activeView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          bookingCount={bookings.filter((b) => b.status === 'CONFIRMED_DEMO').length}
          onOpenAuth={(tab) => {
            setAuthModalTab(tab);
            setAuthModalOpen(true);
          }}
          onLogout={() => {
            authRepository.logout();
            setCurrentUser(null);
            showToast('Signed out of local demo account.');
          }}
        />

        <main className="flex-1">
          {activeView === 'home' && (
            <div className="space-y-16">
              <HeroSection
                stations={stations}
                criteria={criteria}
                onChangeCriteria={setCriteria}
                onSearch={executeSearch}
              />

              {/* Compact Prototype Value Strip */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    {
                      index: '01',
                      title: 'Authentic Coach Maps',
                      detail: 'Inspect SL, 3AC, 2AC, 1AC & Chair Car berth geometries.',
                    },
                    {
                      index: '02',
                      title: 'Instant Demo Tickets',
                      detail: 'Print or download formatted DEMO-ARJ slips with zero payments.',
                    },
                    {
                      index: '03',
                      title: 'RailMate AI Guidance',
                      detail: 'Ask for route comparisons, class advice & berth tips anytime.',
                    },
                    {
                      index: '04',
                      title: 'Future-Ready API Layer',
                      detail: 'Clean TypeScript provider interfaces ready for authorized rail APIs.',
                    },
                  ].map((item) => (
                    <div
                      key={item.index}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs"
                    >
                      <div className="font-mono text-xs font-semibold text-sky-700 mb-1.5">
                        {item.index}.
                      </div>
                      <h3 className="font-display font-bold text-[#0B1F3A] text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              <OffersDestinationsSection
                onSelectDestination={handleSelectDestination}
                onApplyOffer={handleApplyOffer}
                compactMode
              />
            </div>
          )}

          {activeView === 'results' && (
            <TrainResultsView
              stations={stations}
              criteria={criteria}
              trains={trains}
              loading={loadingTrains}
              onChangeCriteria={setCriteria}
              onRunSearch={executeSearch}
              onSelectTrainClass={handleSelectTrainClass}
            />
          )}

          {activeView === 'booking' && selectedTrain && (
            <BookingFlowView
              train={selectedTrain}
              travelClass={selectedClass}
              criteria={criteria}
              currentUser={currentUser}
              onBackToResults={() => setActiveView('results')}
              onCompleteDemoBooking={handleCompleteDemoBooking}
            />
          )}

          {activeView === 'ticket' && activeTicket && (
            <DemoTicketView
              booking={activeTicket}
              onGoToBookings={() => setActiveView('bookings')}
              onSearchAgain={() => setActiveView('home')}
            />
          )}

          {activeView === 'bookings' && (
            <MyBookingsView
              bookings={bookings}
              onViewTicket={(booking) => {
                setActiveTicket(booking);
                setActiveView('ticket');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCancelBooking={handleCancelBooking}
              onExploreTrains={() => setActiveView('home')}
            />
          )}

          {activeView === 'offers' && (
            <div className="py-10">
              <OffersDestinationsSection
                onSelectDestination={handleSelectDestination}
                onApplyOffer={handleApplyOffer}
              />
            </div>
          )}

          {activeView === 'contact' && <ContactArchitectureView />}
        </main>

        <Footer onNavigate={handleNavigate} />

        <RailMateAssistant searchCriteria={criteria} />

        <AuthModal
          isOpen={authModalOpen}
          initialTab={authModalTab}
          currentUser={currentUser}
          onClose={() => setAuthModalOpen(false)}
          onAuthChange={(user) => {
            setCurrentUser(user);
            if (user) {
              showToast(`Signed in locally as ${user.fullName}.`);
            }
          }}
        />

        {/* Subtle Notification Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="no-print fixed bottom-5 left-5 z-50 max-w-sm bg-[#0B1F3A] text-white px-4 py-3 rounded-xl shadow-xl border border-sky-400/30 flex items-center gap-3 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
            <span className="flex-1">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
