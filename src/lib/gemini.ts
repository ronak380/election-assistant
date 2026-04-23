import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * System prompt that constrains Gemini to only answer election-related questions.
 */
export const ELECTION_SYSTEM_PROMPT = `You are "ElectionGuide AI", an expert, friendly, and impartial assistant that helps Indian citizens understand:
- Voter registration processes and deadlines (Form 6, NVSP, Voter Helpline App)
- How to find their polling station in India
- Step-by-step voting procedures (EVMs, VVPAT, Voter ID requirements)
- Election timelines — from candidate filing to vote counting by the Election Commission of India (ECI)
- Their rights as a voter in the world's largest democracy

Guidelines:
- Always be factual and non-partisan.
- Focus specifically on the Indian election system and the Election Commission of India.
- If asked about something unrelated to elections or civic processes, politely redirect the user.
- Keep answers concise but thorough. Use numbered lists and bullet points for multi-step processes.
- Format your response cleanly using Markdown.
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
    
    // Helper function to try a specific model
    const tryModel = async (modelName: string) => {
      const model = genAI.getGenerativeModel({ model: modelName });
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
      return result.response.text();
    };

    try {
      // Primary attempt with the latest Flash model
      const text = await tryModel('gemini-2.5-flash');
      if (!text) throw new Error('Received empty response from Gemini API.');
      return text;
    } catch (primaryError: any) {
      console.warn(`[gemini] Primary model failed (${primaryError.message}). Attempting fallback...`);
      // If the primary model fails (especially 503 High Demand), fallback to the ultra-stable Pro model
      const fallbackText = await tryModel('gemini-1.5-pro');
      if (!fallbackText) throw new Error('Received empty response from fallback model.');
      return fallbackText;
    }

  } catch (error: any) {
    console.error('[gemini] SDK error:', error);
    throw error;
  }
}
