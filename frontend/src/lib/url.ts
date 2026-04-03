export function getSafeExternalUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}
