/**
 * @file src/lib/gemini.ts
 * @description Initializes the Google Generative AI client (Vertex AI / Gemini 2.5)
 *              for server-side use only in Next.js API routes.
 *
 *              The API key / GCP credentials are NEVER sent to the browser.
 *              All Gemini interactions are proxied through the /api/chat endpoint.
 *
 * @see https://googleapis.github.io/js-genai/
 */

import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';

/** The Gemini model to use — targeting Gemini 2.5 Flash for low latency. */
export const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';

/**
 * System prompt that constrains Gemini to only answer election-related questions.
 * Injected as the first message in every chat session.
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
 * Singleton lazy-initialized Gemini AI client.
 * Initialized on first call to getGeminiClient() to avoid startup-time errors
 * when environment variables may not yet be set.
 */
let geminiClient: GoogleGenAI | null = null;

/**
 * Returns the singleton Gemini AI client instance.
 * Uses Application Default Credentials (ADC) in production (Cloud Run).
 * Requires GOOGLE_CLOUD_PROJECT environment variable to be set.
 *
 * @returns {GoogleGenAI} The initialized Google Generative AI client.
 * @throws {Error} If GOOGLE_CLOUD_PROJECT is not set.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';

    if (!project) {
      throw new Error(
        '[gemini] GOOGLE_CLOUD_PROJECT environment variable is not set.'
      );
    }

    geminiClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }

  return geminiClient;
}

/**
 * Sends a single message to Gemini 2.5 and returns the text response.
 * For use in the /api/chat API route.
 *
 * @param {string[]} history - Array of alternating user/model messages for context.
 * @param {string} userMessage - The latest message from the user.
 * @returns {Promise<string>} The text content from Gemini's response.
 * @throws {Error} If the Gemini API call fails or returns an empty response.
 */
export async function generateElectionResponse(
  history: string[],
  userMessage: string
): Promise<string> {
  const client = getGeminiClient();

  const contents = [
    // Inject the system prompt as the first user turn with a model acknowledgement
    { role: 'user', parts: [{ text: ELECTION_SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Understood. I am ready to help citizens with election-related questions.' }] },
    // Add the conversation history
    ...history.map((msg, i) => ({
      role: i % 2 === 0 ? 'user' : 'model' as 'user' | 'model',
      parts: [{ text: msg }],
    })),
    // Add the latest user message
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const response: GenerateContentResponse = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
  });

  const text = response.text;
  if (!text) {
    throw new Error('[gemini] Received empty response from Gemini API.');
  }

  return text;
}
