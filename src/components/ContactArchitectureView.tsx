import React, { useState } from 'react';
import { CheckCircle2, Code2, Layers, Mail, Send, ShieldAlert } from 'lucide-react';

export const ContactArchitectureView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Portfolio Feedback');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter your name (min 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please enter a message of at least 10 characters.');
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold text-sky-700 mb-1.5">
          Prototype Transparency &amp; Contact
        </p>
        <h1 className="font-display text-3xl font-bold text-[#0B1F3A] tracking-tight">
          Contact &amp; Future Railway API Architecture
        </h1>
        <p className="mt-2 text-slate-600 text-base leading-relaxed">
          AI Rail Journey is built as a full-stack TypeScript portfolio showcase demonstrating
          domain-accurate Indian rail UX, clean service boundaries, and optional AI trip assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Architecture & Disclaimer Cards */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#0B1F3A]">
              <ShieldAlert className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">
                Prototype Disclaimer &amp; Non-Affiliation
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 leading-relaxed list-disc pl-5">
              <li>
                <strong>Not Affiliated with IRCTC or Indian Railways:</strong> All train schedules,
                coach numbers, seat availability, and rupee fares are local prototype data.
              </li>
              <li>
                <strong>No Real PNR or Live Inventory:</strong> Tickets generated produce a local{' '}
                <span className="font-mono text-xs text-[#0B1F3A]">DEMO-ARJ-XXXXXX</span> reference
                stored in browser <span className="font-mono text-xs">localStorage</span>.
              </li>
              <li>
                <strong>Zero Payment Collection:</strong> No card, UPI, or banking details are ever
                requested or transmitted.
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#0B1F3A]">
              <Layers className="w-5 h-5 text-sky-600" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">
                Future Authorized Railway API Integration Blueprint
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The frontend UI never reads raw JSON arrays directly. Instead, search, coach layouts,
              and booking persistence communicate exclusively through typed service interfaces:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#0B1F3A] mb-1.5">
                  <Code2 className="w-4 h-4 text-sky-600" aria-hidden="true" />
                  <span>IRailCatalogProvider</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Currently backed by <span className="font-mono">LocalPrototypeRailProvider</span>.
                  Can be swapped to an authorized IRCTC / CRIS B2B partner API proxy without
                  modifying search or coach UI components.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#0B1F3A] mb-1.5">
                  <Code2 className="w-4 h-4 text-sky-600" aria-hidden="true" />
                  <span>IBookingRepository</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Currently persisted in browser <span className="font-mono">localStorage</span>.
                  Designed to plug into authenticated backend database endpoints and authorized PNR
                  webhooks.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Validated Contact Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <Mail className="w-5 h-5 text-sky-600" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-[#0B1F3A]">Send Prototype Feedback</h2>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" aria-hidden="true" />
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                Feedback Recorded Locally
              </h3>
              <p className="text-sm text-slate-600">
                Thank you, {name}. Your message regarding <span className="font-semibold">{topic}</span>{' '}
                was captured in this demo session.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="fb-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name *
                </label>
                <input
                  id="fb-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Deshmukh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="fb-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="fb-topic" className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic
                </label>
                <select
                  id="fb-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Portfolio Feedback">Portfolio Feedback</option>
                  <option value="Railway API Architecture">Railway API Architecture</option>
                  <option value="UI/UX & Accessibility">UI/UX &amp; Accessibility</option>
                  <option value="Bug Report">Bug Report</option>
                </select>
              </div>

              <div>
                <label htmlFor="fb-msg" className="block text-xs font-semibold text-slate-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="fb-msg"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share thoughts on the booking flow, coach map, or RailMate AI..."
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
                className="w-full py-3 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Submit Demo Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
