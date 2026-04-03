const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/g;
const UNSAFE_HTML_RE = /<script\b|javascript:|on[a-z]+\s*=|<iframe\b|<object\b|<embed\b|<meta\b|<link\b/i;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;

  const normalized = collapseWhitespace(value.replace(CONTROL_CHARS_RE, ''));
  if (!normalized || normalized.length > maxLength) return null;

  return normalized;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeName(value: unknown, maxLength = 255): string | null {
  return normalizeString(value, maxLength);
}

export function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  return normalizeString(value, maxLength);
}

export function normalizeSlug(value: unknown): string | null {
  const normalized = normalizeString(value, 63)?.toLowerCase() ?? null;
  if (!normalized || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function validatePasswordStrength(value: unknown): string | null {
  if (typeof value !== 'string') {
    return 'Password is required';
  }

  if (value.length < 10) {
    return 'Password must be at least 10 characters long';
  }

  if (value.length > 128) {
    return 'Password must be 128 characters or fewer';
  }

  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    return 'Password must include uppercase, lowercase, number, and symbol characters';
  }

  return null;
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value.trim());
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:') return true;

    return parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function hasUnsafeHtml(value: unknown): boolean {
  return typeof value === 'string' && UNSAFE_HTML_RE.test(value);
}

export function exceedsJsonSize(value: unknown, maxBytes: number): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8') > maxBytes;
  } catch {
    return true;
  }
}
