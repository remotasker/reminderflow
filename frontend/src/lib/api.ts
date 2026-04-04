import axios, { AxiosInstance, AxiosError } from 'axios';
import { clearAuthState } from './auth';
console.log('VERCEL ENV CHECK:', process.env.NEXT_PUBLIC_API_URL);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,   // sends httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
});

// ── Silent refresh logic ──────────────────────────────────────────────────────
//
// When the server returns 401 with code: 'TOKEN_EXPIRED' we attempt one silent
// refresh before giving up. A single shared promise prevents a thundering herd
// of concurrent requests each triggering their own refresh.

let refreshPromise: Promise<void> | null = null;

async function silentRefresh(): Promise<void> {
  const res = await axios.post(
    `${API_URL}/api/auth/refresh`,
    {},
    { withCredentials: true }
  );
  if (res.status !== 200) throw new Error('Refresh failed');
}

// ── Response interceptor ───────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retried?: boolean };

    if (!error.response) throw error;

    const { status, data } = error.response as { status: number; data: any };

    // Attempt a silent refresh on the first TOKEN_EXPIRED 401.
    // The _retried flag prevents infinite retry loops.
    if (status === 401 && (data?.code === 'TOKEN_EXPIRED') && !originalRequest._retried) {
      originalRequest._retried = true;

      try {
        // Deduplicate: if a refresh is already in-flight, wait for it.
        refreshPromise ??= silentRefresh().finally(() => { refreshPromise = null; });
        await refreshPromise;

        // Retry the original request — the new access token cookie is now set.
        return api(originalRequest);
      } catch {
        // Refresh failed (expired, revoked, or reuse detected).
        // Fall through to the hard logout below.
      }
    }

    // Any other 401 (bad credentials, revoked session, etc.) → hard logout.
    if (status === 401 && typeof window !== 'undefined') {
      clearAuthState();
      const isAuthPage =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/signup');
      if (!isAuthPage) window.location.href = '/login';
    }

    throw error;
  }
);

export default api;