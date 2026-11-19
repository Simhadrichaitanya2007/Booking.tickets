import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getDemoAssistantReply } from '../services/railMateLocalEngine';
import { SearchCriteria } from '../types/rail';

interface RailMateAssistantProps {
  searchCriteria: SearchCriteria;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sourceLabel?: string;
}

const QUICK_PROMPTS = [
  'Compare 3AC vs 2AC vs Sleeper',
  'Best trains Mumbai to Goa',
  'Which berth is best for seniors?',
  'Delhi to Mumbai route tips',
];

export const RailMateAssistant: React.FC<RailMateAssistantProps> = ({ searchCriteria }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Namaste! I am RailMate AI. Ask me to suggest Indian rail routes, compare SL / 3AC / 2AC / 1AC / Chair Car classes, or recommend the right berth.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/assistant/status')
      .then((res) => (res.ok ? res.json() : { geminiConfigured: false }))
      .then((data: { geminiConfigured?: boolean }) => {
        if (active) {
          setGeminiConfigured(Boolean(data.geminiConfigured));
          setStatusChecked(true);
        }
      })
      .catch(() => {
        if (active) {
          setGeminiConfigured(false);
          setStatusChecked(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!promptText) setInput('');

    // If Gemini is not configured on the server, run transparently as Demo Assistant
    if (!geminiConfigured) {
      const demoReply = getDemoAssistantReply(text, {
        fromCode: searchCriteria.fromCode,
        toCode: searchCriteria.toCode,
        travelClass: searchCriteria.travelClass,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: demoReply,
          sourceLabel: 'Demo Assistant',
        },
      ]);
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          searchContext: {
            from: searchCriteria.fromCode,
            to: searchCriteria.toCode,
            date: searchCriteria.journeyDate,
            travelClass: searchCriteria.travelClass,
          },
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        configured?: boolean;
      };

      if (!res.ok) {
        if (data.configured === false) {
          setGeminiConfigured(false);
          const fallbackReply = getDemoAssistantReply(text, {
            fromCode: searchCriteria.fromCode,
            toCode: searchCriteria.toCode,
            travelClass: searchCriteria.travelClass,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              text: fallbackReply,
              sourceLabel: 'Demo Assistant',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'model',
              text: data.error || 'Unable to reach Gemini API right now. Please try again.',
              sourceLabel: 'API Error',
            },
          ]);
        }
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply || 'No response text returned.',
          sourceLabel: 'Gemini AI',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Network error while contacting the RailMate AI server endpoint.',
          sourceLabel: 'Connection Error',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="no-print fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            aria-label="RailMate AI travel assistant"
            className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[380px] h-[520px] max-h-[75vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0B1F3A] text-white px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
                  <Bot className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-bold leading-tight">RailMate AI</h2>
                  <p className="text-[11px] text-sky-300 truncate">
                    {!statusChecked
                      ? 'Checking assistant mode...'
                      : geminiConfigured
                        ? 'Gemini AI Connected (gemini-4-hydrogen)'
                        : 'Demo Assistant (Gemini API not configured)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close RailMate AI"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-[#0B1F3A] text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sourceLabel && (
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.sourceLabel}
                    </span>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-500">
                    RailMate AI is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-[11px] font-medium text-[#0B1F3A] whitespace-nowrap shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about routes, classes, berths..."
                aria-label="Ask RailMate AI"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label="Toggle RailMate AI travel assistant"
        className="ml-auto px-4 py-3 rounded-2xl bg-[#0B1F3A] hover:bg-sky-700 text-white shadow-xl border border-sky-400/30 flex items-center gap-2.5 text-sm font-semibold transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-sky-300" aria-hidden="true" />
        <span className="whitespace-nowrap">RailMate AI</span>
      </button>
    </div>
  );
};
