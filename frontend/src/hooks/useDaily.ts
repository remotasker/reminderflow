'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RoomInfo {
  roomName: string | null;
  roomUrl: string | null;
}

export interface TokenInfo {
  token: string;
  roomName: string;
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || 'Request failed'), { status: res.status, upgrade: body.upgrade });
  }
  return res.json();
}

/** Create a Daily room for an event (Pro only). */
export async function createRoom(eventId: string): Promise<RoomInfo> {
  return apiFetch('/api/video/rooms', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });
}

/** Get room info for an event. Returns { roomName: null, roomUrl: null } if no room. */
export async function getRoom(eventId: string): Promise<RoomInfo> {
  return apiFetch(`/api/video/rooms/${eventId}`);
}

/** Delete a Daily room. */
export async function deleteRoom(eventId: string): Promise<void> {
  await apiFetch(`/api/video/rooms/${eventId}`, { method: 'DELETE' });
}

/** Generate an authenticated owner meeting token (for organizers). */
export async function generateToken(eventId: string, isOwner = true): Promise<TokenInfo> {
  return apiFetch('/api/video/token', {
    method: 'POST',
    body: JSON.stringify({ eventId, isOwner }),
  });
}

/** Generate a public attendee token (no auth required). */
export async function generatePublicToken(eventId: string, displayName?: string): Promise<TokenInfo> {
  return apiFetch('/api/video/public-token', {
    method: 'POST',
    body: JSON.stringify({ eventId, displayName }),
  });
}
