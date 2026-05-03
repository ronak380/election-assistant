/**
 * @file src/components/Chat/MessageBubble.tsx
 * @description Atomic component for a single chat message bubble with Markdown support.
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className={isAssistant ? 'chat-bubble-assistant' : 'chat-bubble-user'}>
        {/* Lightweight Markdown Parser */}
        {message.content.split('\n').map((line, i) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i} style={{ margin: i > 0 ? '0.375rem 0 0' : '0' }}>
              {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
      <time className="message-time" dateTime={message.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
    </div>
  );
}
