/**
 * @file src/lib/gemini.ts
 * @description Initializes the Google Generative AI client (Direct Fetch)
 *              for server-side use only in Next.js API routes.
 */

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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: ELECTION_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Understood. I am ElectionGuide AI.' }] },
            ...history.map((msg, i) => ({
              role: i % 2 === 0 ? 'user' : 'model',
              parts: [{ text: msg }],
            })),
            { role: 'user', parts: [{ text: userMessage }] },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Received empty response from Gemini API.');
    }

    return text;
  } catch (error: any) {
    console.error('[gemini] SDK error:', error);
    throw error;
  }
}
