'use client';

import { useEffect, useState, useRef } from 'react';
import { willExpireWithin, getTimeUntilExpiration } from '@/lib/token';
import api from '@/lib/api';
import { clearAuthState } from '@/lib/auth';

interface UseTokenExpirationWarningProps {
  warningMinutes?: number; // Show warning this many minutes before expiration
}

export function useTokenExpirationWarning({ warningMinutes = 2 }: UseTokenExpirationWarningProps = {}) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const monitored = useRef(false);
  const warningShown = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (monitored.current) return;
    monitored.current = true;

    const checkExpiration = () => {
      const msLeft = getTimeUntilExpiration();

      if (msLeft === null) return; // No token found

      // Show warning if within threshold and not already shown
      if (msLeft <= warningMinutes * 60 * 1000 && msLeft > 0) {
        if (!warningShown.current) {
          setShowWarning(true);
          warningShown.current = true;
        }

        // Update time left display
        const secondsLeft = Math.floor(msLeft / 1000);
        const minutesLeft = Math.floor(secondsLeft / 60);
        const sec = secondsLeft % 60;
        setTimeLeft(`${minutesLeft}:${String(sec).padStart(2, '0')}`);
      } else if (msLeft === 0) {
        // Token expired
        setShowWarning(false);
        handleLogout();
      }
    };

    // Check immediately on mount
    checkExpiration();

    // Then check every 5 seconds
    intervalRef.current = setInterval(checkExpiration, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [warningMinutes]);

  const handleRefreshSession = async () => {
    try {
      await api.post('/api/auth/refresh');
      setShowWarning(false);
      warningShown.current = false;
    } catch (err) {
      console.error('Failed to refresh session:', err);
      handleLogout();
    }
  };

  const handleLogout = () => {
    clearAuthState();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return {
    showWarning,
    timeLeft,
    onRefresh: handleRefreshSession,
    onLogout: handleLogout,
  };
}
