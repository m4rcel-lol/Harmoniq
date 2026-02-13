import { useStore } from '../store';

export function VoiceRoomPanel() {
  const { currentChannel } = useStore();

  if (!currentChannel || currentChannel.type !== 'voice') return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="w-20 h-20 rounded-[var(--radius-pill)] bg-harmoniq-blue/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎙️</span>
        </div>
        <h2 className="text-xl font-semibold text-text-primary">{currentChannel.name}</h2>
        <p className="text-text-muted mt-2">Voice channel</p>

        <div className="flex gap-3 mt-6 justify-center">
          <button className="px-6 py-2 rounded-[var(--radius-pill)] bg-success text-white font-medium hover:bg-success/90 transition-colors">
            🎤 Join Voice
          </button>
          <button className="px-6 py-2 rounded-[var(--radius-pill)] bg-bg-secondary border border-border text-text-primary font-medium hover:bg-bg-tertiary transition-colors">
            📹 Join with Video
          </button>
        </div>

        <p className="text-xs text-text-muted mt-4">
          WebRTC powered • Uses TURN/STUN for reliable connectivity
        </p>
      </div>
    </div>
  );
}
