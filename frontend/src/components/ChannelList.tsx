import { useStore } from '../store';
import type { Channel } from '../types';

export function ChannelList() {
  const { channels, currentChannel, currentServer, setCurrentChannel, fetchMessages } = useStore();

  const textChannels = channels.filter((c) => c.type === 'text' || c.type === 'broadcast');
  const voiceChannels = channels.filter((c) => c.type === 'voice');

  const handleChannelClick = async (channel: Channel) => {
    setCurrentChannel(channel);
    await fetchMessages(channel.id);
  };

  if (!currentServer) {
    return (
      <aside className="w-60 bg-bg-secondary border-r border-border flex flex-col">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-text-primary">Harmoniq</h2>
          <p className="text-sm text-text-muted mt-1">Select or create a server to get started</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-bg-secondary border-r border-border flex flex-col" role="complementary" aria-label="Channel list">
      {/* Server header */}
      <div className="h-12 px-4 flex items-center border-b border-border bg-gradient-to-r from-harmoniq-blue to-[var(--color-aurora-end)]">
        <h2 className="text-white font-semibold truncate">{currentServer.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Text Channels */}
        {textChannels.length > 0 && (
          <div>
            <h3 className="px-3 py-1 text-xs font-semibold uppercase text-text-muted tracking-wide">
              {textChannels.some((c) => c.type === 'broadcast') ? 'Channels' : 'Text Channels'}
            </h3>
            {textChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-3 py-1.5 mx-2 rounded-[var(--radius-sm)] text-sm flex items-center gap-2 transition-colors duration-150 ${
                  currentChannel?.id === channel.id
                    ? 'bg-harmoniq-blue/10 text-harmoniq-blue font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
                style={{ width: 'calc(100% - 16px)' }}
                aria-current={currentChannel?.id === channel.id ? 'true' : undefined}
              >
                <span className="text-base">{channel.type === 'broadcast' ? '📢' : '#'}</span>
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div className="mt-3">
            <h3 className="px-3 py-1 text-xs font-semibold uppercase text-text-muted tracking-wide">Voice Channels</h3>
            {voiceChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-3 py-1.5 mx-2 rounded-[var(--radius-sm)] text-sm flex items-center gap-2 transition-colors duration-150 ${
                  currentChannel?.id === channel.id
                    ? 'bg-harmoniq-blue/10 text-harmoniq-blue font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
                style={{ width: 'calc(100% - 16px)' }}
              >
                <span className="text-base">🔊</span>
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
