'use client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:             string;
  email:          string;
  fullName?:      string;
  name?:          string;
  role?:          string;
  organizationId?: string;
  settings?:      Record<string, unknown>;
}

// ── In-memory store ───────────────────────────────────────────────────────────
//
// The user profile is kept in memory only — NOT in localStorage.
//
// Rationale:
//   - The JWT access token lives in an httpOnly cookie, unreachable by JS.
//   - Storing even non-sensitive user data in localStorage creates an XSS
//     exfiltration surface and risks stale data persisting across logouts.
//   - On a hard page reload the browser re-hits GET /api/auth/me (see useAuth),
//     which re-hydrates this store from a fresh DB round-trip.
//
// Trade-off: one extra network request on initial page load. For a SaaS
// dashboard this is acceptable; for a public content site consider SSR cookies.

let _user: AuthUser | null = null;
const listeners = new Set<(user: AuthUser | null) => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener(_user));
}

export function getStoredUser(): AuthUser | null {
  return _user;
}

export function storeAuthUser(user: AuthUser): void {
  _user = user;
  // Belt-and-suspenders: remove any tokens that previous versions may have
  // left in localStorage so old sessions can't be replayed.
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('token');
  }
  notifyListeners();
}

export function clearAuthState(): void {
  _user = null;
  notifyListeners();
}

export function subscribeAuthUser(listener: (user: AuthUser | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
