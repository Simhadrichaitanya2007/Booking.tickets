import React, { useState } from 'react';
import { Plus, Trash2, User, UserCheck, X } from 'lucide-react';
import { authRepository } from '../services/railService';
import { DemoUser, PassengerInput } from '../types/rail';

interface AuthModalProps {
  isOpen: boolean;
  initialTab: 'login' | 'signup';
  currentUser: DemoUser | null;
  onClose: () => void;
  onAuthChange: (user: DemoUser | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab,
  currentUser,
  onClose,
  onAuthChange,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Saved traveler form inside logged-in view
  const [travName, setTravName] = useState('');
  const [travAge, setTravAge] = useState('');
  const [travGender, setTravGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [travBerth, setTravBerth] = useState<PassengerInput['berthPreference']>('Lower');

  React.useEffect(() => {
    setTab(initialTab);
    setError(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      const user = authRepository.login(email, password);
      onAuthChange(user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) {
      setError('Please enter your full name (min 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setError('Demo password must be at least 4 characters.');
      return;
    }
    try {
      const user = authRepository.signUp(fullName, email, password);
      onAuthChange(user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create demo account.');
    }
  };

  const handleInstantDemo = () => {
    const user = authRepository.loginInstantDemoUser();
    onAuthChange(user);
    onClose();
  };

  const handleAddTraveler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const ageNum = Number(travAge);
    if (travName.trim().length < 2 || !Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      setError('Enter a valid traveler name and age (1–120).');
      return;
    }
    setError(null);
    const updated = authRepository.addSavedTraveler(currentUser.id, {
      name: travName.trim(),
      age: String(ageNum),
      gender: travGender,
      berthPreference: travBerth,
    });
    if (updated) {
      onAuthChange(updated);
      setTravName('');
      setTravAge('');
    }
  };

  const handleRemoveTraveler = (travelerId: string) => {
    if (!currentUser) return;
    const updated = authRepository.removeSavedTraveler(currentUser.id, travelerId);
    if (updated) onAuthChange(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sky-700">Local Browser Demo Account</p>
            <h2 id="auth-modal-title" className="font-display text-2xl font-bold text-[#0B1F3A]">
              {currentUser
                ? 'Demo Profile & Saved Travelers'
                : tab === 'login'
                  ? 'Welcome Back'
                  : 'Create Demo Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#0B1F3A] truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  authRepository.logout();
                  onAuthChange(null);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Logout
              </button>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold text-[#0B1F3A] mb-2.5">
                Saved Travelers (Quick Autofill During Booking)
              </h3>
              {currentUser.savedTravelers.length === 0 ? (
                <p className="text-xs text-slate-500">No saved travelers yet.</p>
              ) : (
                <ul className="space-y-2">
                  {currentUser.savedTravelers.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                    >
                      <div>
                        <span className="font-semibold text-[#0B1F3A]">{t.name}</span>
                        <span className="text-xs text-slate-500 ml-2 tabular-nums">
                          {t.age} yrs · {t.gender} · {t.berthPreference}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTraveler(t.id)}
                        aria-label={`Remove ${t.name}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              onSubmit={handleAddTraveler}
              className="pt-4 border-t border-slate-200 space-y-3"
            >
              <div className="text-xs font-semibold text-slate-700">Add Frequent Traveler</div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  value={travName}
                  onChange={(e) => setTravName(e.target.value)}
                  placeholder="Full name"
                  className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={travAge}
                  onChange={(e) => setTravAge(e.target.value)}
                  placeholder="Age"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-sm tabular-nums"
                />
                <select
                  value={travGender}
                  onChange={(e) =>
                    setTravGender(e.target.value as 'Male' | 'Female' | 'Other')
                  }
                  className="sm:col-span-2 px-2 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={travBerth}
                  onChange={(e) =>
                    setTravBerth(e.target.value as PassengerInput['berthPreference'])
                  }
                  className="sm:col-span-3 px-2 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="Lower">Lower</option>
                  <option value="Middle">Middle</option>
                  <option value="Upper">Upper</option>
                  <option value="Side Lower">Side Lower</option>
                  <option value="Window">Window</option>
                </select>
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Traveler</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Switch Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'login' ? 'bg-white text-[#0B1F3A] shadow-xs' : 'text-slate-600'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'signup' ? 'bg-white text-[#0B1F3A] shadow-xs' : 'text-slate-600'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form
              onSubmit={tab === 'login' ? handleLoginSubmit : handleSignupSubmit}
              className="space-y-3.5"
              noValidate
            >
              {tab === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Nair"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="auth-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                  Demo Password
                </label>
                <input
                  id="auth-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
              >
                {tab === 'login' ? 'Sign In to Demo Account' : 'Create Local Demo Account'}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <button
                type="button"
                onClick={handleInstantDemo}
                className="w-full py-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0B1F3A] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-sky-700" aria-hidden="true" />
                <span>Quick Sign In as Sample Traveler (Aarav Sharma)</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Stored strictly in browser localStorage for prototype testing. Never enter real
                IRCTC credentials or sensitive passwords.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
