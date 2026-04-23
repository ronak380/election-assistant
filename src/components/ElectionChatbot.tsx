/**
 * @file src/components/ElectionChatbot.tsx
 * @description AI-powered chatbot component using Gemini 2.5 via the /api/chat endpoint.
 *
 *              Features:
 *              - Real-time conversation with Gemini 2.5 AI
 *              - Message history maintained in React state
 *              - Authenticated users' histories persisted to Firestore via /api/history
 *              - Animated message bubbles with typing indicator
 *              - Suggestion chips for quick-start prompts
 *              - Full accessibility: aria-live region, focus management, aria-busy
 *
 * @accessibility
 *   - role="log" + aria-live="polite" so screen readers announce new messages
 *   - aria-label on message input
 *   - aria-busy on submit button during loading
 *   - Keyboard-only navigation fully supported
 */

'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { trackChatMessage } from '@/lib/analytics';

/** Shape of a single chat message. */
interface Message {
  /** Unique identifier for this message. */
  id: string;
  /** Who sent this message. */
  role: 'user' | 'assistant';
  /** The message text content. */
  content: string;
  /** ISO timestamp of when the message was created. */
  timestamp: string;
}

/** Quick-start suggestion chips shown when the chat is empty. */
const SUGGESTIONS = [
  'How do I register to vote?',
  'Where is my nearest polling station?',
  'What ID do I need to vote?',
  'How does mail-in voting work?',
  'What happens after Election Day?',
  'What are my rights as a voter?',
];

/**
 * Generates a lightweight unique ID for messages.
 * Uses crypto.randomUUID if available, falls back to Math.random.
 *
 * @returns {string} A unique string identifier.
 */
function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * ElectionChatbot — the main AI chatbot interface.
 * Communicates with the backend /api/chat route which proxies to Gemini 2.5.
 *
 * @returns {JSX.Element} The fully interactive chatbot UI.
 */
export default function ElectionChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Deep link detection
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get('topic');
      if (topic && messages.length === 0) {
        let q = '';
        if (topic === 'rights') q = 'What are my rights as a voter at the polling station?';
        if (topic === 'reminders') q = 'How can I set up election reminders?';
        if (topic === 'mail-in') q = 'How does mail-in voting work?';

        if (q) {
          sendMessage(q);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [messages.length, sendMessage]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-scroll the chat log to the latest message. */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  /**
   * Saves a message pair (user + assistant) to Firestore via the /api/history endpoint.
   * Only runs if the user is signed in.
   *
   * @param {string} userMessage - The user's original message.
   * @param {string} assistantReply - The assistant's response.
   */
  const persistHistory = useCallback(async (userMessage: string, assistantReply: string) => {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userMessage, assistantReply }),
      });
    } catch {
      // Non-critical — history persistence failure should not break the UX
      console.warn('[ElectionChatbot] Failed to persist chat history.');
    }
  }, []);

  /**
   * Sends the user's message to the /api/chat backend endpoint.
   * Updates state with the reply and optionally persists to Firestore.
   *
   * @param {string} text - The message text to send.
   */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    trackChatMessage(trimmed);

    // Build flat history array for the API (alternating user/model strings)
    const history = messages.flatMap((m) => [m.content]);

    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const idToken = user ? await user.getIdToken() : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, idToken }),
      });

      const data = await response.json() as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? 'Failed to get a response. Please try again.');
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await persistHistory(trimmed, data.reply);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
      // Return focus to input after response
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isLoading, messages, persistHistory]);

  /** Handle form submission. */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  /**
   * Allow Shift+Enter for newlines; plain Enter submits the form.
   *
   * @param {KeyboardEvent<HTMLTextAreaElement>} e - The keyboard event.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  return (
    <section
      className="chatbot-section"
      aria-labelledby="chatbot-heading"
    >
      <div className="container">
        <header className="section-header">
          <h2 id="chatbot-heading">
            <span className="gradient-text">Election Assistant AI</span>
          </h2>
          <p className="section-subtitle">
            Powered by Gemini 2.5 — ask anything about the voting process.
          </p>
        </header>

        <div className="chatbot-container glass-card">
          {/* Chat Messages Log */}
          <div
            className="chat-log"
            role="log"
            aria-label="Conversation with Election Assistant AI"
            aria-live="polite"
            aria-relevant="additions"
            aria-atomic="false"
            tabIndex={0}
          >
            {/* Empty state with suggestion chips */}
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <div className="chat-avatar" aria-hidden="true">🗳️</div>
                {!mounted ? (
                   <div className="spinner" />
                ) : (
                  <>
                    <p className="chat-welcome">
                      <strong>Hello! I&apos;m ElectionGuide AI.</strong>
                      <br />
                      Ask me anything about voter registration, polling stations, or the election process.
                    </p>
                    <div
                      className="suggestions"
                      role="list"
                      aria-label="Suggested questions to ask"
                    >
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          role="listitem"
                          onClick={() => sendMessage(s)}
                          className="suggestion-chip"
                          aria-label={`Ask: ${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message chat-message--${msg.role}`}
              >
                <div
                  className={
                    msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                  }
                  style={{ padding: '0.875rem 1.25rem', maxWidth: '80%', wordBreak: 'break-word' }}
                >
                  {/* Format assistant replies with line breaks */}
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: i > 0 ? '0.375rem 0 0' : '0' }}>{line}</p>
                  ))}
                </div>
                <time
                  className="message-time"
                  dateTime={msg.timestamp}
                  aria-label={`Sent at ${new Date(msg.timestamp).toLocaleTimeString()}`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div
                className="chat-message chat-message--assistant"
                role="status"
                aria-label="ElectionGuide AI is typing"
              >
                <div className="chat-bubble-assistant typing-indicator" style={{ padding: '1rem 1.25rem' }}>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                className="chat-error"
                role="alert"
                aria-live="assertive"
              >
                ⚠️ {error}
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSubmit}
            className="chat-input-form"
            aria-label="Send a message to the Election Assistant"
          >
            <label htmlFor="chat-input" className="sr-only">
              Type your election question
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about elections, voting, or registration..."
              className="chat-input"
              rows={1}
              maxLength={2000}
              aria-label="Your message (press Enter to send, Shift+Enter for new line)"
              aria-describedby="chat-input-hint"
              disabled={isLoading}
            />
            <div id="chat-input-hint" className="sr-only">
              Press Enter to send your message, or Shift+Enter to add a new line.
            </div>
            <button
              type="submit"
              className="btn btn-primary chat-send-btn"
              disabled={isLoading || !input.trim()}
              aria-label={isLoading ? 'AI is responding, please wait' : 'Send message'}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .chatbot-section { padding-block: 4rem; }
        .chatbot-container { overflow: hidden; max-width: 800px; margin-inline: auto; }
        .chat-log {
          height: 480px;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scroll-behavior: smooth;
        }
        .chat-log:focus { outline: none; }
        .chat-empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; padding: 2rem 1rem; }
        .chat-avatar { font-size: 3rem; }
        .chat-welcome { color: var(--text-secondary); line-height: 1.7; }
        .suggestions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.5rem; }
        .suggestion-chip {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-primary-200);
          background: var(--color-primary-50);
          color: var(--color-primary-700);
          font-size: 0.825rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .suggestion-chip:hover { background: var(--color-primary-100); border-color: var(--color-primary-400); transform: translateY(-1px); }
        .chat-message { display: flex; flex-direction: column; gap: 0.25rem; animation: fadeIn 0.3s ease; }
        .chat-message--user { align-items: flex-end; }
        .chat-message--assistant { align-items: flex-start; }
        .message-time { font-size: 0.7rem; color: var(--text-muted); padding-inline: 0.25rem; }
        .typing-indicator { display: flex; gap: 4px; align-items: center; }
        .typing-indicator span {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--color-primary-400);
          animation: typing-bounce 1.2s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .chat-error {
          padding: 0.875rem 1.25rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-danger);
          font-size: 0.9rem;
        }
        .chat-input-form {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-surface);
        }
        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 0.9375rem;
          line-height: 1.5;
          resize: none;
          max-height: 160px;
          transition: border-color var(--transition-fast);
        }
        .chat-input:focus { outline: none; border-color: var(--color-primary-500); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .chat-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .chat-send-btn { border-radius: var(--radius-md); padding: 0.75rem; flex-shrink: 0; }
        @media (max-width: 640px) {
          .chat-log { height: 360px; }
          .suggestions { flex-direction: column; }
        }
      `}</style>
    </section>
  );
}
