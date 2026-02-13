import { useState, useRef, type KeyboardEvent } from 'react';
import { useStore } from '../store';
import { getSocket } from '../services/socket';

export function Composer() {
  const { currentChannel } = useStore();
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (!currentChannel || currentChannel.type === 'voice') return null;

  const handleSend = () => {
    if (!content.trim()) return;

    const socket = getSocket();
    if (socket && currentChannel) {
      socket.emit('message.create', {
        channelId: currentChannel.id,
        content: content.trim(),
      });
    }

    setContent('');
    inputRef.current?.focus();

    // Stop typing indicator
    const s = getSocket();
    if (s) s.emit('typing.stop', { channelId: currentChannel.id });
    setIsTyping(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (value: string) => {
    setContent(value);

    const socket = getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing.start', { channelId: currentChannel.id });
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing.stop', { channelId: currentChannel.id });
    }, 3000);
  };

  return (
    <div className="px-4 pb-4 pt-1 bg-bg-primary">
      <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-[var(--radius-md)] p-2">
        {/* Attachment button */}
        <button
          className="p-2 rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors flex-shrink-0"
          title="Attach file"
          aria-label="Attach file"
        >
          📎
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${currentChannel.name}`}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-text-primary placeholder:text-text-muted min-h-[24px] max-h-[200px]"
          rows={1}
          aria-label={`Message input for ${currentChannel.name}`}
        />

        {/* Emoji button */}
        <button
          className="p-2 rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors flex-shrink-0"
          title="Emoji"
          aria-label="Emoji picker"
        >
          😀
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="p-2 rounded-[var(--radius-sm)] bg-harmoniq-blue text-white hover:bg-harmoniq-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
