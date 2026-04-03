// Token utilities for extracting exp claim and calculating time to expiration

/**
 * Decode a JWT token (without verification) to extract claims.
 * This is safe because we only read the payload; verification happens server-side.
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf-8')
    );
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get the expiration time of a token from cookies.
 * Returns the timestamp in milliseconds, or null if unable to decode.
 */
export function getTokenExpTime(): number | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split('; ');
  const accessTokenCookie = cookies.find(c => c.startsWith('access_token='));
  
  if (!accessTokenCookie) return null;

  const token = accessTokenCookie.split('=')[1];
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;

  // exp is in seconds, convert to milliseconds
  return decoded.exp * 1000;
}

/**
 * Calculate milliseconds until token expires.
 * Returns 0 if already expired, or null if token not found.
 */
export function getTimeUntilExpiration(): number | null {
  const expTime = getTokenExpTime();
  if (expTime === null) return null;

  const now = Date.now();
  const timeLeft = expTime - now;

  return Math.max(0, timeLeft);
}

/**
 * Check if token will expire within the given number of minutes.
 */
export function willExpireWithin(minutes: number): boolean {
  const timeLeft = getTimeUntilExpiration();
  if (timeLeft === null) return false;

  const milliseconds = minutes * 60 * 1000;
  return timeLeft <= milliseconds;
}
