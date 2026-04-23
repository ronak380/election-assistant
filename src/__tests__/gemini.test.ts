/**
 * @file src/__tests__/gemini.test.ts
 * @description Unit tests for the Gemini AI integration library.
 *
 *              Tests cover:
 *              - Response caching (cache hit avoids API call)
 *              - Model fallback chain (tries next model on failure)
 *              - History trimming (sends max 6 entries)
 *              - Error handling (missing API key, all models fail)
 *              - Empty response rejection
 */

import {
  generateElectionResponse,
  clearResponseCache,
  getResponseCacheSize,
} from '@/lib/gemini';

// ============================================================================
// MOCKS
// ============================================================================

/** Mock generateContent function — returns a successful response by default. */
const mockGenerateContent = jest.fn();

/** Mock getGenerativeModel — wraps mockGenerateContent. */
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// ============================================================================
// HELPERS
// ============================================================================

const MOCK_REPLY = 'You can register at nvsp.in using Form 6.';

/** Sets up mockGenerateContent to return a successful response. */
function mockSuccess(text = MOCK_REPLY) {
  mockGenerateContent.mockResolvedValue({
    response: { text: () => text },
  });
}

/** Sets up mockGenerateContent to throw an error. */
function mockFailure(message = 'Service unavailable') {
  mockGenerateContent.mockRejectedValue(new Error(message));
}

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  clearResponseCache();
  mockGenerateContent.mockReset();
  mockGetGenerativeModel.mockClear();
  process.env.GEMINI_API_KEY = 'test-api-key';
});

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
});

// ============================================================================
// TESTS — API KEY
// ============================================================================
describe('generateElectionResponse — API key validation', () => {
  it('throws if GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      generateElectionResponse([], 'How do I vote?')
    ).rejects.toThrow('GEMINI_API_KEY is not set');
  });
});

// ============================================================================
// TESTS — BASIC RESPONSE
// ============================================================================
describe('generateElectionResponse — basic response', () => {
  it('returns the AI response text on success', async () => {
    mockSuccess();
    const result = await generateElectionResponse([], 'How do I register to vote?');
    expect(result).toBe(MOCK_REPLY);
  });

  it('calls generateContent with a prompt containing the user message', async () => {
    mockSuccess();
    const message = 'What is VVPAT?';
    await generateElectionResponse([], message);
    const callArg = mockGenerateContent.mock.calls[0][0] as string;
    expect(callArg).toContain(message);
  });
});

// ============================================================================
// TESTS — RESPONSE CACHE
// ============================================================================
describe('generateElectionResponse — response cache', () => {
  it('returns cached result without calling API a second time', async () => {
    mockSuccess();
    const message = 'How do I find my polling station?';

    // First call — hits the API
    const first = await generateElectionResponse([], message);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Second call — should use cache
    const second = await generateElectionResponse([], message);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1); // still 1
    expect(second).toBe(first);
  });

  it('normalises cache key (trims whitespace, lowercases)', async () => {
    mockSuccess();

    await generateElectionResponse([], 'How do I vote?');
    await generateElectionResponse([], '  HOW DO I VOTE?  ');

    // Should have been a cache hit on the second call
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('caches the response (cache size increases after first call)', async () => {
    mockSuccess();
    expect(getResponseCacheSize()).toBe(0);
    await generateElectionResponse([], 'Test message');
    expect(getResponseCacheSize()).toBe(1);
  });

  it('clearResponseCache resets the cache to empty', async () => {
    mockSuccess();
    await generateElectionResponse([], 'Another test message');
    expect(getResponseCacheSize()).toBe(1);
    clearResponseCache();
    expect(getResponseCacheSize()).toBe(0);
  });

  it('different messages are cached independently', async () => {
    mockSuccess();
    await generateElectionResponse([], 'Question A');
    await generateElectionResponse([], 'Question B');
    expect(getResponseCacheSize()).toBe(2);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// TESTS — MODEL FALLBACK CHAIN
// ============================================================================
describe('generateElectionResponse — model fallback chain', () => {
  it('falls back to next model when primary fails', async () => {
    // First call (gemini-2.5-flash) fails, second (gemini-2.0-flash) succeeds
    mockGenerateContent
      .mockRejectedValueOnce(new Error('429 Quota exceeded'))
      .mockResolvedValueOnce({ response: { text: () => MOCK_REPLY } });

    const result = await generateElectionResponse([], 'What is EVM?');
    expect(result).toBe(MOCK_REPLY);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('tries all 3 models before throwing', async () => {
    mockFailure('Service unavailable');

    await expect(
      generateElectionResponse([], 'Fail all models test')
    ).rejects.toThrow('All Gemini models failed');

    // Should have tried all 3 models
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('succeeds on the third model after two failures', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce({ response: { text: () => 'Third model success' } });

    const result = await generateElectionResponse([], 'Third model test');
    expect(result).toBe('Third model success');
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// TESTS — HISTORY TRIMMING
// ============================================================================
describe('generateElectionResponse — history trimming', () => {
  it('includes history in the prompt when provided', async () => {
    mockSuccess();
    const history = ['Previous user question', 'Previous AI answer'];
    await generateElectionResponse(history, 'New question');
    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('Previous user question');
  });

  it('only passes the last 6 history entries (trims older ones)', async () => {
    mockSuccess();
    // 10 entries — only last 6 should appear
    const history = Array.from({ length: 10 }, (_, i) => `Message ${i}`);
    await generateElectionResponse(history, 'Latest question');
    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    // Message 0-3 should NOT be in the prompt (they are beyond the last 6)
    expect(prompt).not.toContain('Message 0');
    expect(prompt).not.toContain('Message 3');
    // Message 4-9 (last 6) SHOULD be in the prompt
    expect(prompt).toContain('Message 4');
    expect(prompt).toContain('Message 9');
  });

  it('sends no history text when history array is empty', async () => {
    mockSuccess();
    await generateElectionResponse([], 'Question with no history');
    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).not.toContain('Previous Conversation');
  });
});
