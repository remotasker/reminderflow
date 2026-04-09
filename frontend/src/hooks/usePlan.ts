'use client';

import { useEffect, useState, useCallback } from 'react';

export interface PlanStatus {
  plan: 'free' | 'pro';
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  trialDaysLeft: number | null;
  isPro: boolean;
  isTrialing: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
let cachedStatus: Omit<PlanStatus, 'isLoading' | 'error' | 'refresh'> | null = null;

export function usePlan(): PlanStatus {
  const [data, setData] = useState<Omit<PlanStatus, 'isLoading' | 'error' | 'refresh'> | null>(
    cachedStatus
  );
  const [isLoading, setIsLoading] = useState(!cachedStatus);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/billing/status`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch plan status');
      const raw = await res.json();
      const parsed = {
        plan:             raw.plan ?? 'free',
        status:           raw.status ?? 'active',
        trialEndsAt:      raw.trialEndsAt ?? null,
        currentPeriodEnd: raw.currentPeriodEnd ?? null,
        trialDaysLeft:    raw.trialDaysLeft ?? null,
        isPro:            raw.plan === 'pro' && (raw.status === 'active' || raw.status === 'trialing'),
        isTrialing:       raw.status === 'trialing',
      };
      cachedStatus = parsed;
      setData(parsed);
    } catch (e: any) {
      setError(e.message);
      // Default to free on error so UI doesn't break
      const fallback = {
        plan: 'free' as const,
        status: 'active' as const,
        trialEndsAt: null,
        currentPeriodEnd: null,
        trialDaysLeft: null,
        isPro: false,
        isTrialing: false,
      };
      setData(fallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cachedStatus) {
      fetch_();
    }
  }, [fetch_]);

  const refresh = useCallback(() => {
    cachedStatus = null;
    fetch_();
  }, [fetch_]);

  return {
    plan:             data?.plan ?? 'free',
    status:           data?.status ?? 'active',
    trialEndsAt:      data?.trialEndsAt ?? null,
    currentPeriodEnd: data?.currentPeriodEnd ?? null,
    trialDaysLeft:    data?.trialDaysLeft ?? null,
    isPro:            data?.isPro ?? false,
    isTrialing:       data?.isTrialing ?? false,
    isLoading,
    error,
    refresh,
  };
}
