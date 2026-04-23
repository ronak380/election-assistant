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

/** The Gemini model to use — targeting Gemini 1.5 Flash for superior stability. */
export const GEMINI_MODEL = 'gemini-1.5-flash';

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
 * Singleton lazy-initialized Gemini AI client.
 */
let geminiClient: GoogleGenAI | null = null;

/**
 * Returns the singleton Gemini AI client instance.
 *
 * @returns {GoogleGenAI} The initialized Google Generative AI client.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    // If using the @google/genai package, we typically need an API Key.
    // However, if the user is using the Vertex AI shim in @google/genai,
    // they need to provide project and location.
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const apiKey = process.env.GEMINI_API_KEY; // Fallback to API Key if present
    const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'europe-west1';

    if (apiKey) {
      geminiClient = new GoogleGenAI({ apiKey });
    } else if (project) {
      // Vertex AI initialization via @google/genai (if supported in this version)
      // Note: For full Vertex AI features, @google-cloud/vertexai is preferred.
      geminiClient = new GoogleGenAI({
        // @ts-ignore - vertexai might not be in the types but is supported in the runtime for some versions
        vertexai: true,
        project,
        location,
      });
    } else {
      throw new Error(
        '[gemini] Neither GEMINI_API_KEY nor GOOGLE_CLOUD_PROJECT is set.'
      );
    }
  }

  return geminiClient;
}

/**
 * Sends a single message to Gemini and returns the text response.
 */
export async function generateElectionResponse(
  history: string[],
  userMessage: string
): Promise<string> {
  try {
    const client = getGeminiClient();

    // The @google/genai SDK uses client.models.generateContent
    // We use 'as any' to bypass the build-time type check for this specific SDK version
    const response = await (client as any).models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { role: 'user', parts: [{ text: ELECTION_SYSTEM_PROMPT }] },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ElectionGuide AI, ready to assist with election-related inquiries.' }],
        },
        ...history.map((msg, i) => ({
          role: i % 2 === 0 ? 'user' : 'model',
          parts: [{ text: msg }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ],
    });

    const text = response.text;

    if (!text) {
      throw new Error('[gemini] Received empty response from Gemini API.');
    }

    return text;
  } catch (error) {
    console.error('[gemini] Generation error:', error);
    throw new Error('Failed to generate response from AI Assistant.');
  }
}
