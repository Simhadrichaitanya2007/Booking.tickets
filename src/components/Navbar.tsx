import React, { useState } from 'react';
import { Menu, TrainFront, User, LogOut, X } from 'lucide-react';
import { AppView, DemoUser } from '../types/rail';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: DemoUser | null;
  bookingCount: number;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{ view: AppView; label: string }> = [
  { view: 'home', label: 'Home' },
  { view: 'results', label: 'Search Trains' },
  { view: 'bookings', label: 'My Bookings' },
  { view: 'offers', label: 'Offers' },
  { view: 'contact', label: 'Contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  currentUser,
  bookingCount,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg py-1"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B1F3A] to-sky-600 text-white flex items-center justify-center shadow-sm">
            <TrainFront className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-[#0B1F3A]">
            AI Rail Journey
          </span>
        </button>

        {/* Zone 2: Primary Nav Links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeView === item.view ||
              (item.view === 'results' && (activeView === 'booking' || activeView === 'ticket'));
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md ${
                  isActive
                    ? 'text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                <span>{item.label}</span>
                {item.view === 'bookings' && bookingCount > 0 && (
                  <span className="ml-1.5 font-mono text-xs tabular-nums text-sky-700">
                    ({bookingCount})
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-sky-600 rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Auth Actions */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span className="max-w-[140px] truncate">{currentUser.fullName}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of demo account"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-sm font-semibold text-[#0B1F3A] hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0B1F3A] hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.view === 'bookings' && bookingCount > 0 && (
                    <span className="font-mono text-xs tabular-nums text-sky-700">
                      {bookingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-[#0B1F3A] text-left truncate"
                >
                  {currentUser.fullName}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-[#0B1F3A]"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-sm font-semibold"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
