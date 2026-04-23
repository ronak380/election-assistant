/**
 * @file src/__tests__/chat-route.test.ts
 * @description Unit tests for the /api/chat Next.js API route.
 *
 *              Tests cover:
 *              - Request validation (missing message, too long, bad JSON)
 *              - Successful response + rate-limit headers
 *              - Error propagation from Gemini (503)
 *              - Optional Firebase Auth (valid token, invalid token, no token)
 *
 * @jest-environment node
 */

// ============================================================================
// MOCKS — must be defined before any imports that use them
// ============================================================================

/** Mock Gemini response generator */
const mockGenerateElectionResponse = jest.fn();
jest.mock('@/lib/gemini', () => ({
  generateElectionResponse: (...args: unknown[]) =>
    mockGenerateElectionResponse(...args),
}));

/** Mock Firebase Admin Auth */
const mockVerifyIdToken = jest.fn();
jest.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
}));

// ============================================================================
// IMPORTS
// ============================================================================

// We import POST after mocks are set up.
// Using jest.isolateModules would reset the rate-limiter between tests,
// but since we use unique IPs per test, a single import is fine.
import { POST } from '@/app/api/chat/route';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a minimal mock request that satisfies what POST() needs:
 *   - headers.get(key)
 *   - .json() → body
 *
 * Avoids importing NextRequest (which requires the Web API `Request` global).
 */
function makeRequest(
  body: Record<string, unknown> | string,
  ip = '127.0.0.1'
) {
  return {
    headers: {
      get: (key: string) => {
        if (key === 'x-forwarded-for') return ip;
        if (key === 'x-real-ip') return null;
        return null;
      },
    },
    // Simulate valid or invalid JSON
    json: async () => {
      if (typeof body === 'string') throw new SyntaxError('Unexpected token');
      return body;
    },
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  mockGenerateElectionResponse.mockReset();
  mockVerifyIdToken.mockReset();
});

// ============================================================================
// TESTS — REQUEST VALIDATION
// ============================================================================
describe('/api/chat — request validation', () => {
  it('returns 400 when message field is missing', async () => {
    const req = makeRequest({ history: [] }, '192.0.2.1');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/message/i);
  });

  it('returns 400 when message is an empty string', async () => {
    const req = makeRequest({ message: '   ' }, '192.0.2.2');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/non-empty/i);
  });

  it('returns 400 when message exceeds 2000 characters', async () => {
    const req = makeRequest({ message: 'A'.repeat(2001) }, '192.0.2.3');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/maximum/i);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = makeRequest('not-json', '192.0.2.4');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid request body/i);
  });
});

// ============================================================================
// TESTS — SUCCESSFUL RESPONSE
// ============================================================================
describe('/api/chat — successful response', () => {
  it('returns 200 with the AI reply on a valid request', async () => {
    mockGenerateElectionResponse.mockResolvedValue('Here is how to vote in India...');

    const req = makeRequest({ message: 'How do I vote?', history: [] }, '10.1.0.1');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply).toBe('Here is how to vote in India...');
  });

  it('includes X-RateLimit headers in the response', async () => {
    mockGenerateElectionResponse.mockResolvedValue('Test reply');

    const req = makeRequest({ message: 'Test message' }, '10.1.0.2');
    const res = await POST(req);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('50');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy();
  });

  it('calls generateElectionResponse with the correct message and history', async () => {
    mockGenerateElectionResponse.mockResolvedValue('EVM answer');

    const req = makeRequest({ message: 'What is EVM?', history: ['prev'] }, '10.1.0.3');
    await POST(req);

    expect(mockGenerateElectionResponse).toHaveBeenCalledWith(['prev'], 'What is EVM?');
  });

  it('trims the message before sending to Gemini', async () => {
    mockGenerateElectionResponse.mockResolvedValue('Trimmed answer');

    const req = makeRequest({ message: '  How to register?  ' }, '10.1.0.4');
    await POST(req);

    expect(mockGenerateElectionResponse).toHaveBeenCalledWith(
      expect.anything(),
      'How to register?'
    );
  });
});

// ============================================================================
// TESTS — ERROR HANDLING
// ============================================================================
describe('/api/chat — error handling', () => {
  it('returns 503 when Gemini throws an error', async () => {
    mockGenerateElectionResponse.mockRejectedValue(new Error('All models failed'));

    const req = makeRequest({ message: 'Will this fail?' }, '10.1.0.5');
    const res = await POST(req);

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain('AI Assistant Error');
  });

  it('includes the error message in the 503 body', async () => {
    mockGenerateElectionResponse.mockRejectedValue(new Error('Quota exceeded'));

    const req = makeRequest({ message: 'Quota test' }, '10.1.0.6');
    const res = await POST(req);

    const json = await res.json();
    expect(json.error).toContain('Quota exceeded');
  });
});

// ============================================================================
// TESTS — OPTIONAL FIREBASE AUTH
// ============================================================================
describe('/api/chat — optional Firebase auth', () => {
  it('proceeds as anonymous when no idToken is provided', async () => {
    mockGenerateElectionResponse.mockResolvedValue('Anonymous reply');

    const req = makeRequest({ message: 'Anonymous question' }, '10.1.0.7');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('verifies idToken when provided and includes uid in response', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-abc-123' });
    mockGenerateElectionResponse.mockResolvedValue('Auth reply');

    const req = makeRequest(
      { message: 'Authenticated question', idToken: 'valid-token-xyz' },
      '10.1.0.8'
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-xyz');
    const json = await res.json();
    expect(json.uid).toBe('user-abc-123');
  });

  it('proceeds as anonymous (does not block) if idToken is invalid', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));
    mockGenerateElectionResponse.mockResolvedValue('Fallback reply');

    const req = makeRequest(
      { message: 'Bad token question', idToken: 'expired-token' },
      '10.1.0.9'
    );
    const res = await POST(req);

    // Should still return 200, not block the request
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// TESTS — RATE LIMITING
// ============================================================================
describe('/api/chat — rate limiting', () => {
  it('returns 429 after exceeding 50 requests from the same IP', async () => {
    // Use a unique IP to avoid state pollution from other tests
    const rateLimitIp = '10.9.9.1';
    mockGenerateElectionResponse.mockResolvedValue('ok');

    // Send 50 successful requests
    for (let i = 0; i < 50; i++) {
      const req = makeRequest({ message: `Message ${i}` }, rateLimitIp);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 51st request should be rate-limited
    const req = makeRequest({ message: 'Over limit' }, rateLimitIp);
    const res = await POST(req);
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error).toMatch(/too many requests/i);
  });
});
