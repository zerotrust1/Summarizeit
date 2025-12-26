import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

// Simple in-memory store for rate limiting
// For production, use Redis
const store: RateLimitStore = {};

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

/**
 * Get the client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
  return ip;
}

/**
 * Check rate limit for a client
 * Returns { allowed: boolean, retryAfter?: number }
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  retryAfter?: number;
} {
  const ip = getClientIp(request);
  const now = Date.now();

  // Initialize or reset if window expired
  if (!store[ip] || now > store[ip].resetTime) {
    store[ip] = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  const entry = store[ip];
  const allowed = entry.count < RATE_LIMIT_MAX;

  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Middleware to enforce rate limiting
 */
export function rateLimitMiddleware(request: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(request);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter?.toString() || '900',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Add rate limit info to response headers
  // This will be handled in the route handler
  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(response: NextResponse) {
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString());
  return response;
}
