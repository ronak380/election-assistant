/**
 * @file src/app/assistant/page.tsx
 * @description The AI Election Assistant chatbot page.
 *              Renders the ElectionChatbot component with page-level SEO metadata.
 */

import type { Metadata } from 'next';
import { ClientNavbar, ClientChatbot } from '@/components/ClientShell';

/** SEO metadata specific to the AI assistant page. */
export const metadata: Metadata = {
  title: 'AI Election Assistant',
  description:
    'Chat with our Gemini 2.5-powered AI to get instant answers about voter registration, elections timelines, mail-in voting, and more.',
};

/**
 * AssistantPage renders the AI chatbot interface.
 *
 * @returns The AI assistant page.
 */
export default function AssistantPage() {
  return (
    <>
      <ClientNavbar />
      <main id="main-content" tabIndex={-1}>
        <ClientChatbot />
      </main>
    </>
  );
}
