/**
 * @file src/lib/gemini.ts
 * @description Gemini AI integration for the Election Assistant chatbot.
 *
 *              Features:
 *              - In-memory response cache (max 50 entries) to avoid hitting free-tier
 *                quota limits for repeated/similar questions.
 *              - Model fallback chain: gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash
 *              - History trimming: only last 6 messages (3 turns) are sent to reduce TPM usage.
 *
 * @see https://ai.google.dev/gemini-api/docs/models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Structured logger for Google Cloud Logging compatibility.
 * @param severity - Log severity level
 * @param message - Main log message
 * @param metadata - Optional structured metadata
 */
function log(severity: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata: object = {}) {
  console.log(JSON.stringify({
    severity,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  }));
}

/**
 * System prompt that constrains Gemini to only answer election-related questions.
 * Focused on the Indian election system for an Indian user base.
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
- Always encourage civic participation.
- Language Support: Detect the language of the user's query and respond in that same language (e.g., Hindi, Bengali, Telugu, Marathi, Tamil, etc.). If unsure, default to clear English.`;

/**
 * Ordered list of Gemini models to try, from best to most available.
 * The fallback chain ensures the app keeps working even if the primary model
 * is rate-limited or unavailable on the free tier.
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
] as const;

/** Maximum number of cached responses to keep in memory. LRU eviction. */
const CACHE_MAX_SIZE = 50;

/** Maximum history entries to send (trimmed to last N strings = N/2 turns). */
const MAX_HISTORY_ENTRIES = 6;

/**
 * Simple in-memory LRU response cache.
 * Key: trimmed user message (lowercased).
 * Value: cached AI response string.
 */
const responseCache = new Map<string, string>();

/**
 * Returns a cache key for a given user message.
 * Normalises whitespace and lowercases for better hit rate.
 */
function getCacheKey(message: string): string {
  return message.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Stores a response in the cache, evicting the oldest entry if at capacity.
 */
function setCacheEntry(key: string, value: string): void {
  if (responseCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest entry (first inserted key in Map)
    const firstKey = responseCache.keys().next().value;
    if (firstKey !== undefined) responseCache.delete(firstKey);
  }
  responseCache.set(key, value);
}

/**
 * Attempts to generate a response from a single Gemini model.
 * Throws if the model call fails (so the caller can try the next model).
 *
 * @param {GoogleGenerativeAI} genAI - Initialised SDK client.
 * @param {string} modelName - The Gemini model identifier to use.
 * @param {string} finalPrompt - The complete prompt (history + user message).
 * @returns {Promise<string>} The model's text response.
 */
async function tryModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  finalPrompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: ELECTION_SYSTEM_PROMPT,
  });

  const result = await model.generateContent(finalPrompt);
  const text = result.response.text();

  if (!text) throw new Error(`Empty response from ${modelName}.`);
  return text;
}

/**
 * Sends a message to Gemini with automatic model fallback and response caching.
 *
 * Algorithm:
 * 1. Check in-memory cache — return immediately on hit.
 * 2. Trim history to last MAX_HISTORY_ENTRIES strings to save tokens.
 * 3. Try each model in MODEL_FALLBACK_CHAIN until one succeeds.
 * 4. Cache the successful response before returning.
 *
 * @param {string[]} history - Flat array of previous messages (alternating user/assistant).
 * @param {string} userMessage - The current user message.
 * @returns {Promise<string>} The AI response text.
 * @throws {Error} If all models in the fallback chain fail.
 */
export async function generateElectionResponse(
  history: string[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  // --- Cache check ---
  const cacheKey = getCacheKey(userMessage);
  const cached = responseCache.get(cacheKey);
  if (cached) {
    log('INFO', `[gemini] Cache hit for: ${userMessage.slice(0, 50)}...`, { cache_hit: true, prompt_preview: userMessage.slice(0, 50) });
    return cached;
  }

  // --- History trimming (last MAX_HISTORY_ENTRIES strings = 3 turns) ---
  const trimmedHistory = history.slice(-MAX_HISTORY_ENTRIES);

  // Format as a simple conversation string to reduce payload size
  let conversationText = '';
  if (trimmedHistory.length > 0) {
    conversationText =
      'Previous Conversation:\n' +
      trimmedHistory
        .map((msg, i) => (i % 2 === 0 ? 'User: ' : 'Assistant: ') + msg)
        .join('\n') +
      '\n\n';
  }

  const finalPrompt = `${conversationText}User Question: ${userMessage}`;

  // --- Model fallback chain ---
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const errors: string[] = [];

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      log('INFO', `[gemini] Trying model: ${modelName}`, { model: modelName });
      const text = await tryModel(genAI, modelName, finalPrompt);

      // Cache the successful response
      setCacheEntry(cacheKey, text);

      return text;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log('WARNING', `[gemini] Model ${modelName} failed`, { model: modelName, error: msg });
      errors.push(`${modelName}: ${msg}`);
    }
  }

  // All models failed
  throw new Error(
    `All Gemini models failed. Errors: ${errors.join(' | ')}`
  );
}

/**
 * Clears the in-memory response cache.
 * Useful for testing or manual cache invalidation.
 */
export function clearResponseCache(): void {
  responseCache.clear();
}

/**
 * Returns the current size of the response cache.
 * Exposed for testing purposes.
 */
export function getResponseCacheSize(): number {
  return responseCache.size;
}
