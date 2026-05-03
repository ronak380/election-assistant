/**
 * @file src/components/ElectionChatbot.tsx
 * @description AI-powered chatbot component refactored for Atomic Design.
 */

'use client';

import { useState, useRef, useCallback, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { trackChatMessage } from '@/lib/analytics';
import MessageBubble from './Chat/MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTIONS = [
  'How do I register to vote?',
  'Where is my nearest polling station?',
  'What ID do I need to vote?',
  'How does mail-in voting work?',
  'What happens after Election Day?',
];

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ElectionChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { id: generateId(), role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    trackChatMessage(trimmed);

    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const idToken = user ? await user.getIdToken() : undefined;
      const history = messages.flatMap((m) => [m.content]).slice(-6);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, idToken }),
      });

      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error ?? 'Failed to get a response.');

      const assistantMessage: Message = { id: generateId(), role: 'assistant', content: data.reply, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isLoading, messages]);

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

  return (
    <section className="chatbot-section" aria-labelledby="chatbot-heading">
      <div className="container">
        <header className="section-header">
          <h2 id="chatbot-heading"><span className="gradient-text">Election Assistant AI</span></h2>
          <p className="section-subtitle">Powered by Gemini 2.5 AI — ask anything about voting and elections.</p>
        </header>

        <div className="chatbot-container glass-card">
          <div className="chat-log" role="log" aria-label="Conversation" aria-live="polite" tabIndex={0}>
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <div className="chat-avatar" aria-hidden="true">🗳️</div>
                {!mounted ? <div className="spinner" /> : (
                  <>
                    <p className="chat-welcome"><strong>Hello! I&apos;m ElectionGuide AI.</strong><br />Ask me anything about elections.</p>
                    <div className="suggestions">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => sendMessage(s)} className="suggestion-chip" aria-label={`Ask: ${s}`}>{s}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}

            {isLoading && (
              <div className="chat-message chat-message--assistant" role="status" aria-label="Typing">
                <div className="chat-bubble-assistant typing-indicator">
                  <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
                </div>
              </div>
            )}

            {error && <div className="chat-error" role="alert">⚠️ {error}</div>}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <textarea
              id="chat-input" ref={inputRef} value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask a question..." className="chat-input" rows={1} disabled={isLoading}
            />
            <button type="submit" className="btn btn-primary chat-send-btn" disabled={isLoading || !input.trim()}>
              {isLoading ? <span className="spinner" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
