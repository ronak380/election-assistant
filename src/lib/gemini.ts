/**
 * @file src/lib/gemini.ts
 * @description Gemini AI integration for the Election Assistant chatbot.
 *              Refactored to use the official startChat SDK pattern for high-fidelity context handling.
 */

import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';

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

export const ELECTION_SYSTEM_PROMPT = `You are "ElectionGuide AI", an expert, friendly, and impartial assistant that helps Indian citizens understand:
- Voter registration processes and deadlines (Form 6, NVSP, Voter Helpline App)
- How to find their polling station in India
- Step-by-step voting procedures (EVMs, VVPAT, Voter ID requirements)
- Election timelines from candidate filing to counting by the Election Commission of India (ECI)
- Their rights as a voter in the world's largest democracy

Guidelines:
- Always be factual and non-partisan.
- Focus specifically on the Indian election system (ECI).
- If asked about something unrelated to elections, politely redirect the user.
- Keep answers concise but thorough. Use Markdown formatting.
- Language Support: Detect and respond in the user's language (Hindi, etc.). Default to English.`;

const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const;

const CACHE_MAX_SIZE = 50;
const MAX_HISTORY_ENTRIES = 6;
const responseCache = new Map<string, string>();

function getCacheKey(message: string): string {
  return message.toLowerCase().trim().replace(/\s+/g, ' ');
}

function setCacheEntry(key: string, value: string): void {
  if (responseCache.size >= CACHE_MAX_SIZE) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey !== undefined) responseCache.delete(firstKey);
  }
  responseCache.set(key, value);
}

/**
 * Sends a message to Gemini with automatic model fallback and response caching.
 * Uses the official chat session pattern for superior context retention.
 *
 * @param {string[]} history - Flat array of previous messages (user/assistant).
 * @param {string} userMessage - The current user message.
 * @returns {Promise<string>} The AI response text.
 */
export async function generateElectionResponse(
  history: string[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');

  const cacheKey = getCacheKey(userMessage);
  const cached = responseCache.get(cacheKey);
  if (cached) return cached;

  // Convert flat string history to official Content objects
  const chatHistory: Content[] = history.slice(-MAX_HISTORY_ENTRIES).map((content, i) => ({
    role: i % 2 === 0 ? 'user' : 'model',
    parts: [{ text: content } as Part],
  }));

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const errors: string[] = [];

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      log('INFO', `[gemini] Trying model: ${modelName}`, { model: modelName });
      
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: ELECTION_SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 1024 },
      });

      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();

      if (!text) throw new Error('Empty response');
      setCacheEntry(cacheKey, text);
      return text;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log('WARNING', `[gemini] Model ${modelName} failed`, { model: modelName, error: msg });
      errors.push(`${modelName}: ${msg}`);
    }
  }

  throw new Error(`All models failed: ${errors.join(' | ')}`);
}

/** Clears the in-memory response cache. */
export function clearResponseCache(): void {
  responseCache.clear();
}

/** Returns the current size of the response cache. */
export function getResponseCacheSize(): number {
  return responseCache.size;
}
