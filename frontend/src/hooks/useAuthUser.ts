'use client';

import { useEffect, useState } from 'react';
import { getStoredUser, subscribeAuthUser, type AuthUser } from '@/lib/auth';
import { ensureAuthUser } from '@/lib/session';

export function useAuthUser(bootstrap = true) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => bootstrap && !getStoredUser());

  useEffect(() => subscribeAuthUser(setUser), []);

  useEffect(() => {
    if (!bootstrap) {
      setLoading(false);
      return undefined;
    }

    const existing = getStoredUser();
    if (existing) {
      setUser(existing);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    ensureAuthUser()
      .then((nextUser) => {
        if (!cancelled) setUser(nextUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  return { user, loading };
}
