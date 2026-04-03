'use client';

import api from './api';
import { getStoredUser, storeAuthUser, type AuthUser } from './auth';

let authUserPromise: Promise<AuthUser> | null = null;

export async function ensureAuthUser(): Promise<AuthUser> {
  const stored = getStoredUser();
  if (stored) return stored;

  authUserPromise ??= api.get('/api/auth/me')
    .then(({ data }) => {
      storeAuthUser(data.user);
      return data.user as AuthUser;
    })
    .finally(() => {
      authUserPromise = null;
    });

  return authUserPromise;
}
