import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
  onPin?: (id: string) => void;
}

export function MessageItem({ message, onEdit, onDelete, onReact, onPin }: MessageItemProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="group flex gap-3 px-4 py-1 hover:bg-bg-tertiary/50 transition-colors duration-150 animate-fade-in"
      role="article"
      aria-label={`Message from ${message.author_display_name || message.author_username}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {message.author_avatar ? (
          <img
            src={message.author_avatar}
            alt={message.author_username}
            className="w-10 h-10 rounded-[var(--radius-pill)] object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-[var(--radius-pill)] bg-harmoniq-blue flex items-center justify-center text-white font-semibold text-sm">
            {(message.author_display_name || message.author_username).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-text-primary hover:underline cursor-pointer">
            {message.author_display_name || message.author_username}
          </span>
          <time className="text-xs text-text-muted">{time}</time>
          {message.edited_at && <span className="text-xs text-text-muted">(edited)</span>}
          {message.is_pinned && <span className="text-xs text-warning" title="Pinned">📌</span>}
        </div>

        <div className="text-sm text-text-primary mt-0.5 break-words whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-harmoniq-blue text-sm hover:underline flex items-center gap-1"
              >
                📎 {att.filename}
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-pill)] bg-bg-tertiary text-xs hover:bg-harmoniq-blue/10 transition-colors"
              >
                <span>{reaction.emoji}</span>
                <span className="text-text-muted">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="hidden group-hover:flex items-start gap-1 mt-1">
        <button
          onClick={() => onReact?.(message.id, '👍')}
          className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-bg-tertiary text-xs"
          title="React"
        >
          😀
        </button>
        <button
          onClick={() => onEdit?.(message.id, message.content)}
          className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-bg-tertiary text-xs"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onPin?.(message.id)}
          className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-bg-tertiary text-xs"
          title="Pin"
        >
          📌
        </button>
        <button
          onClick={() => onDelete?.(message.id)}
          className="p-1 rounded-[var(--radius-sm)] text-text-muted hover:text-danger hover:bg-danger/10 text-xs"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
