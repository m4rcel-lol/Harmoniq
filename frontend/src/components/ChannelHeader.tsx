import { useStore } from '../store';

export function ChannelHeader() {
  const { currentChannel, toggleMembersPanel } = useStore();

  if (!currentChannel) return null;

  const icon = currentChannel.type === 'voice' ? '🔊' : currentChannel.type === 'broadcast' ? '📢' : '#';

  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-border bg-bg-secondary" role="banner">
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-lg">{icon}</span>
        <h2 className="font-semibold text-text-primary">{currentChannel.name}</h2>
        {currentChannel.topic && (
          <>
            <span className="text-border">|</span>
            <span className="text-sm text-text-muted truncate max-w-[300px]">{currentChannel.topic}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-[var(--radius-sm)] text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Search"
          title="Search messages"
        >
          🔍
        </button>
        <button
          className="p-2 rounded-[var(--radius-sm)] text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Pin"
          title="Pinned messages"
        >
          📌
        </button>
        <button
          onClick={toggleMembersPanel}
          className="p-2 rounded-[var(--radius-sm)] text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Members"
          title="Toggle member list"
        >
          👥
        </button>
      </div>
    </header>
  );
}
