/**
 * @file src/__tests__/gemini.test.ts
 * @description Updated unit tests for the Gemini AI integration (Chat Session pattern).
 */

import {
  generateElectionResponse,
  clearResponseCache,
  getResponseCacheSize,
} from '@/lib/gemini';

// ============================================================================
// MOCKS
// ============================================================================

const mockSendMessage = jest.fn();
const mockStartChat = jest.fn(() => ({
  sendMessage: mockSendMessage,
}));

const mockGetGenerativeModel = jest.fn(() => ({
  startChat: mockStartChat,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// ============================================================================
// HELPERS
// ============================================================================

const MOCK_REPLY = 'You can register at nvsp.in.';

function mockSuccess(text = MOCK_REPLY) {
  mockSendMessage.mockResolvedValue({
    response: { text: () => text },
  });
}

function mockFailure(message = 'Service unavailable') {
  mockSendMessage.mockRejectedValue(new Error(message));
}

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  clearResponseCache();
  mockSendMessage.mockReset();
  mockStartChat.mockClear();
  mockGetGenerativeModel.mockClear();
  process.env.GEMINI_API_KEY = 'test-api-key';
});

// ============================================================================
// TESTS
// ============================================================================

describe('generateElectionResponse — Chat Session Logic', () => {
  it('throws if GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(generateElectionResponse([], 'test')).rejects.toThrow('GEMINI_API_KEY is not set');
  });

  it('returns AI response and caches it', async () => {
    mockSuccess();
    const result = await generateElectionResponse([], 'How to vote?');
    expect(result).toBe(MOCK_REPLY);
    expect(getResponseCacheSize()).toBe(1);
    
    // Second call uses cache
    await generateElectionResponse([], 'How to vote?');
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it('normalises cache keys', async () => {
    mockSuccess();
    await generateElectionResponse([], 'VOTE');
    await generateElectionResponse([], '  vote  ');
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it('passes history correctly to startChat', async () => {
    mockSuccess();
    const history = ['Hello', 'Hi there'];
    await generateElectionResponse(history, 'New message');
    
    const startChatArgs = mockStartChat.mock.calls[0][0];
    expect(startChatArgs.history).toHaveLength(2);
    expect(startChatArgs.history[0].role).toBe('user');
    expect(startChatArgs.history[1].role).toBe('model');
  });

  it('trims history to MAX_HISTORY_ENTRIES (6)', async () => {
    mockSuccess();
    const longHistory = ['1', '2', '3', '4', '5', '6', '7', '8'];
    await generateElectionResponse(longHistory, 'Next');
    
    const startChatArgs = mockStartChat.mock.calls[0][0];
    expect(startChatArgs.history).toHaveLength(6);
    expect(startChatArgs.history[0].parts[0].text).toBe('3');
  });

  it('falls back to next model on failure', async () => {
    mockSendMessage
      .mockRejectedValueOnce(new Error('Quota exceeded'))
      .mockResolvedValueOnce({ response: { text: () => 'Fallback success' } });

    const result = await generateElectionResponse([], 'Try fallback');
    expect(result).toBe('Fallback success');
    expect(mockSendMessage).toHaveBeenCalledTimes(2);
  });

  it('throws error after trying all 4 models', async () => {
    mockFailure('Network Error');
    await expect(generateElectionResponse([], 'Fail')).rejects.toThrow('All models failed');
    expect(mockSendMessage).toHaveBeenCalledTimes(4);
  });
});
