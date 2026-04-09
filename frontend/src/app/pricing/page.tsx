'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, X, Sparkles, Zap, ArrowRight, Shield, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const FREE_FEATURES = [
  { label: 'Unlimited email reminders', included: true },
  { label: 'Built-in email templates', included: true },
  { label: 'Event registration forms', included: true },
  { label: 'Basic analytics', included: true },
  { label: 'Up to 3 events at once', included: true },
  { label: 'WhatsApp reminders', included: false },
  { label: 'Custom email sender address', included: false },
  { label: 'Custom email templates', included: false },
  { label: 'Priority support', included: false },
];

const PRO_FEATURES = [
  { label: 'Everything in Free', included: true },
  { label: 'WhatsApp reminders (Twilio)', included: true },
  { label: 'Custom email sender address', included: true, soon: true },
  { label: 'Custom email templates', included: true },
  { label: 'Unlimited events', included: true },
  { label: 'Advanced analytics', included: true },
  { label: 'Priority support', included: true },
  { label: '14-day free trial', included: true },
];

export default function PricingPage() {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');

  async function handleUpgrade() {
    setLoadingCheckout(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status === 401) {
        window.location.href = '/signup';
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open checkout');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <Sparkles size={18} className="text-indigo-500" />
            ReminderFlow
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-all">
              Get started free
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-6">
            <Shield size={12} />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Start free. Upgrade when you need more.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            ReminderFlow is free forever for basic email reminders. Upgrade to Pro when WhatsApp and custom branding matter.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Sparkles size={20} className="text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Free</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Perfect for getting started</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">KSh 0</span>
              <span className="text-slate-400 text-sm ml-1">/ month</span>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f.label} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${f.included ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {f.included
                      ? <Check size={10} className="text-emerald-600 dark:text-emerald-400" />
                      : <X size={10} className="text-slate-400" />
                    }
                  </div>
                  <span className={`text-sm ${f.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col relative overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Zap size={20} className="text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-white">Pro</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-medium">
                  Most Popular
                </span>
              </div>
              <p className="text-sm text-slate-400">For teams that need more</p>
            </div>

            <div className="relative mb-2">
              <span className="text-4xl font-bold text-white">KSh 1,500</span>
              <span className="text-slate-400 text-sm ml-1">/ month</span>
            </div>
            <div className="flex items-center gap-1.5 mb-6">
              <Clock size={12} className="text-indigo-400" />
              <span className="text-xs text-indigo-400 font-medium">14-day free trial — no card required at signup</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f.label} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <Check size={10} className="text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-300">
                    {f.label}
                    {f.soon && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium">Soon</span>}
                  </span>
                </li>
              ))}
            </ul>

            {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

            <button
              onClick={handleUpgrade}
              disabled={loadingCheckout}
              className="relative w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {loadingCheckout ? 'Redirecting…' : (<>Start 14-day Free Trial <ArrowRight size={16} /></>)}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">Cancel anytime. No hidden fees.</p>
          </div>
        </div>

        {/* FAQ strip */}
        <div className="mt-20 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Questions?{' '}
            <Link href="/help" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Visit our help center
            </Link>
            {' '}or{' '}
            <Link href="/subscription" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              manage your subscription
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
