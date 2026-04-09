'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Zap, Check, Clock, ArrowRight, CreditCard, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PRO_FEATURES = [
  'WhatsApp reminders',
  'Custom email sender address (coming soon)',
  'Custom email templates',
  'Unlimited events',
  'Advanced analytics',
  'Priority support',
];

export default function SubscriptionPage() {
  const { plan, status, trialEndsAt, currentPeriodEnd, trialDaysLeft, isPro, isTrialing, isLoading, refresh } = usePlan();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Welcome to Pro! Your trial has started.');
      refresh();
    }
    if (searchParams.get('canceled') === 'true') {
      toast.error('Checkout canceled.');
    }
  }, [searchParams, refresh]);

  async function handleUpgrade() {
    try {
      const res = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Failed to open checkout');
    } catch {
      toast.error('Network error. Please try again.');
    }
  }

  async function handlePortal() {
    try {
      const res = await fetch(`${API_BASE}/api/billing/portal`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Failed to open billing portal');
    } catch {
      toast.error('Network error. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading billing info…</p>
        </div>
      </div>
    );
  }

  const formattedPeriodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const formattedTrialEnd = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 font-sans">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1 tracking-tight">
          Subscription & Billing
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your plan and billing details
        </p>
      </div>

      {/* Current plan status card */}
      <div className={`rounded-2xl border p-6 mb-6 ${
        isPro
          ? 'bg-slate-900 dark:bg-slate-800 border-slate-700 text-white'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPro ? 'bg-indigo-500/20 border border-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}>
              {isPro ? <Zap size={20} className="text-indigo-400" /> : <Sparkles size={20} className="text-slate-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-semibold ${isPro ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </h2>
                {/* Status badge */}
                {status === 'trialing' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-medium">
                    Trial
                  </span>
                )}
                {status === 'active' && isPro && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium">
                    Active
                  </span>
                )}
                {status === 'past_due' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-medium">
                    Past Due
                  </span>
                )}
                {status === 'canceled' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-400 font-medium">
                    Canceled
                  </span>
                )}
              </div>
              <p className={`text-sm ${isPro ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {isPro ? 'KSh 1,500 / month' : 'Free — forever'}
              </p>
            </div>
          </div>

          {isPro && status === 'active' && (
            <button
              onClick={handlePortal}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all"
            >
              <CreditCard size={13} /> Manage billing
            </button>
          )}
        </div>

        {/* Trial countdown */}
        {isTrialing && trialDaysLeft !== null && (
          <div className="mt-5 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your free trial
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Your trial ends on <strong className="text-slate-300">{formattedTrialEnd}</strong>. Add a payment method to continue using Pro after the trial.
            </p>
            <button
              onClick={handlePortal}
              className="mt-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 transition-all"
            >
              <CreditCard size={12} /> Add payment method
            </button>
          </div>
        )}

        {/* Active Pro next renewal */}
        {isPro && status === 'active' && formattedPeriodEnd && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400">
              Next renewal: <span className="text-slate-300 font-medium">{formattedPeriodEnd}</span>
            </p>
          </div>
        )}

        {/* Past due */}
        {status === 'past_due' && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Payment failed</p>
              <p className="text-xs text-slate-400 mt-1">Please update your payment method to keep your Pro features active.</p>
              <button onClick={handlePortal} className="mt-2 text-xs text-red-400 hover:text-red-300 underline">Update payment method</button>
            </div>
          </div>
        )}
      </div>

      {/* Free tier: upgrade card */}
      {!isPro && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Unlock Pro Features</h3>
          </div>

          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{f}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Pro — KSh 1,500/month</p>
              <p className="text-xs text-slate-500 mt-0.5">Includes 14-day free trial</p>
            </div>
            <Clock size={14} className="text-indigo-500" />
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all active:scale-[0.98] shadow-sm"
          >
            Start 14-Day Free Trial
            <ArrowRight size={16} />
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">No credit card required to start. Cancel anytime.</p>
        </div>
      )}

      {/* Pro: what's included */}
      {isPro && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Your Pro Features</h3>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Canceled */}
      {status === 'canceled' && !isPro && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={18} className="text-slate-400" />
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Subscription canceled</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Your Pro subscription has been canceled. You're now on the Free plan.</p>
          <button onClick={handleUpgrade} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Reactivate Pro →
          </button>
        </div>
      )}

      {/* Link to pricing */}
      <div className="text-center">
        <Link href="/pricing" className="text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          View full plan comparison →
        </Link>
      </div>
    </div>
  );
}
