import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * System prompt that constrains Gemini to only answer election-related questions.
 */
export const ELECTION_SYSTEM_PROMPT = `You are "ElectionGuide AI", an expert, friendly, and impartial assistant that helps citizens understand:
- Voter registration processes and deadlines
- How to find their polling station
- Step-by-step voting procedures (mail-in, in-person, early voting)
- Election timelines — from candidate filing to vote counting and certification
- Their rights as a voter

Guidelines:
- Always be factual and non-partisan.
- If asked about something unrelated to elections or civic processes, politely redirect the user.
- Keep answers concise but thorough. Use numbered lists and bullet points for multi-step processes.
- Highlight important deadlines and dates.
- Always encourage civic participation.`;

/**
 * Sends a single message to Gemini and returns the text response.
 */
export async function generateElectionResponse(
  history: string[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: ELECTION_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I am ElectionGuide AI.' }] },
        ...history.map((msg, i) => ({
          role: i % 2 === 0 ? 'user' : 'model',
          parts: [{ text: msg }],
        })),
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    if (!text) {
      throw new Error('Received empty response from Gemini API.');
    }

    return text;
  } catch (error: any) {
    console.error('[gemini] SDK error:', error);
    throw error;
  }
}
