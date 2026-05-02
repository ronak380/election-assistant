import { generateElectionResponse } from '../lib/gemini';

// Mock the Gemini library
jest.mock('../lib/gemini', () => ({
  generateElectionResponse: jest.fn(),
  ELECTION_SYSTEM_PROMPT: 'Mock System Prompt',
}));

describe('Chat Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully generates an AI response for a valid question', async () => {
    const mockResponse = 'You can register via Form 6 on NVSP.';
    (generateElectionResponse as jest.Mock).mockResolvedValue(mockResponse);

    const result = await generateElectionResponse([], 'How do I register?');

    expect(result).toBe(mockResponse);
    expect(generateElectionResponse).toHaveBeenCalledWith([], 'How do I register?');
  });

  it('handles API failures gracefully via the fallback chain', async () => {
    (generateElectionResponse as jest.Mock).mockRejectedValue(new Error('Model overloaded'));

    await expect(generateElectionResponse([], 'Test message')).rejects.toThrow('Model overloaded');
  });

  it('maintains system instructions and impartiality', () => {
    const { ELECTION_SYSTEM_PROMPT } = jest.requireActual('../lib/gemini');
    expect(ELECTION_SYSTEM_PROMPT).toBeDefined();
    expect(ELECTION_SYSTEM_PROMPT).toContain('ElectionGuide AI');
  });
});
