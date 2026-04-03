import { Request, Response, NextFunction } from 'express';

// ── NOTE: production recommendation ──────────────────────────────────────────
//
// This implementation uses a process-local in-memory store (Map). It works
// correctly for a single-server deployment but has two limitations:
//
//   1. State is lost on process restart — a crash resets all counters.
//   2. It does not share state across multiple instances (horizontal scaling).
//
// For production with more than one Node process, replace the `buckets` Map
// with a Redis-backed store. The interface below (`Entry` + `getClientKey`)
// stays the same; only the read/write calls change.
//
// Example Redis drop-in (using ioredis):
//
//   const redis = new Redis(process.env.REDIS_URL);
//
//   async function increment(key: string, windowMs: number): Promise<number> {
//     const count = await redis.incr(key);
//     if (count === 1) await redis.pexpire(key, windowMs);
//     return count;
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitOptions {
  keyPrefix: string;
  limit:     number;
  windowMs:  number;
  message?:  string;
}

interface Entry {
  count:   number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();

function getClientKey(req: Request, keyPrefix: string): string {
  // req.ip already applies Express's trust proxy rules, so it only uses
  // X-Forwarded-For when the hop chain is explicitly trusted.
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  return `${keyPrefix}:${clientIp}`;
}

function pruneExpiredEntries(now: number): void {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    keyPrefix,
    limit,
    windowMs,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    pruneExpiredEntries(now);

    const key     = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= limit) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({ error: message });
      return;
    }

    current.count += 1;
    next();
  };
}
