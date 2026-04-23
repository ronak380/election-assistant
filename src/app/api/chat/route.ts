/**
 * @file src/app/api/chat/route.ts
 * @description Secure Next.js API Route for the Gemini 2.5 Election Assistant chatbot.
 *
 *              This endpoint acts as a secure proxy between the client and Vertex AI.
 *              The GCP credentials NEVER leave the server environment.
 *
 *              Rate limiting: In-memory sliding-window limiter (50 req / min per IP).
 *              Auth: Validates Firebase ID token if provided. Anonymous users allowed.
 *
 * @method POST
 * @route /api/chat
 */

import { NextResponse, type NextRequest } from 'next/server';
import { generateElectionResponse } from '@/lib/gemini';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Structured logger for Google Cloud Logging compatibility.
 */
function log(severity: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata: object = {}) {
  console.log(JSON.stringify({
    severity,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  }));
}

/** Force dynamic rendering — this route uses runtime env vars (Firebase Admin). */
export const dynamic = 'force-dynamic';

/** In-memory rate-limiter store: maps IP → [timestamp array]. */
const rateLimitMap = new Map<string, number[]>();

/** Maximum number of requests allowed per IP within the window. */
const RATE_LIMIT_MAX = 50;

/** Rate-limit sliding window duration in milliseconds (1 minute). */
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Checks and enforces a simple sliding-window rate limit for a given IP address.
 *
 * @param {string} ip - The requester's IP address.
 * @returns {{ allowed: boolean; remaining: number }} Whether the request is allowed and remaining quota.
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return { allowed: true, remaining: RATE_LIMIT_MAX - timestamps.length };
}

/**
 * Expected request body shape from the client chatbot component.
 */
interface ChatRequestBody {
  /** The latest message typed by the user. */
  message: string;
  /** Flat array of previous messages alternating user/model (for context). */
  history?: string[];
  /** Firebase ID token for authenticated users (optional). */
  idToken?: string;
}

/**
 * POST /api/chat
 *
 * Accepts a user message and conversation history, authenticates the user
 * if an ID token is supplied, enforces rate limits, then proxies the request
 * to Gemini 2.5 via Vertex AI.
 *
 * @param {NextRequest} request - Incoming HTTP request with JSON body.
 * @returns {NextResponse} JSON response containing Gemini's reply or an error.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Rate Limiting ---
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // --- Request Parsing ---
  let body: ChatRequestBody;
  try {
    body = await request.json() as ChatRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON.' },
      { status: 400 }
    );
  }

  const { message, history = [], idToken } = body;

  // --- Strict Validation (Zod-style) ---
  if (typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid message: must be a non-empty string.' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Invalid message: exceeds the maximum allowed length of 2000 characters.' }, { status: 400 });
  }
  if (!Array.isArray(history) || !history.every(h => typeof h === 'string')) {
    return NextResponse.json({ error: 'Invalid history: must be an array of strings.' }, { status: 400 });
  }

  // --- Optional Firebase Auth Verification ---
  let uid: string | null = null;
  if (idToken) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      // Invalid token — fall through as anonymous user (don't block request)
      log('WARNING', '[/api/chat] Invalid ID token supplied — proceeding as anonymous.');
    }
  }

  // --- Call Gemini 2.5 ---
  try {
    const reply = await generateElectionResponse(history, message.trim());

    return NextResponse.json(
      { reply, uid },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log('ERROR', '[/api/chat] Gemini error', { error: errorMsg, ip });
    
    // Diagnostic: return the actual error message to help identify 503 causes
    return NextResponse.json(
      { error: `AI Assistant Error: ${errorMsg}` },
      { status: 503 }
    );
  }
}
