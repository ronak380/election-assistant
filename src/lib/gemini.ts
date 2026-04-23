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
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    
    // Use the exact model and configuration that worked in CrowdFlow.
    // We use the official 'systemInstruction' property to drastically reduce 
    // the complexity of the request history, avoiding the 503 High Demand trigger.
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: ELECTION_SYSTEM_PROMPT
    });

    // Format history as a single string to reduce object payload size
    let conversationText = '';
    if (history.length > 0) {
      conversationText = 'Previous Conversation:\n' + history.map((msg, i) => {
        return (i % 2 === 0 ? 'User: ' : 'Assistant: ') + msg;
      }).join('\n') + '\n\n';
    }

    const finalPrompt = `${conversationText}User Question: ${userMessage}`;
    const result = await model.generateContent(finalPrompt);
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
