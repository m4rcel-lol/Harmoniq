import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { MessageItem } from './MessageItem';
import { api } from '../services/api';

export function MessageList() {
  const { messages, currentChannel } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEdit = async (id: string, currentContent: string) => {
    const newContent = prompt('Edit message:', currentContent);
    if (newContent && newContent !== currentContent && currentChannel) {
      await api.channels.editMessage(currentChannel.id, id, newContent);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this message?') && currentChannel) {
      await api.channels.deleteMessage(currentChannel.id, id);
    }
  };

  const handleReact = async (id: string, emoji: string) => {
    if (currentChannel) {
      await api.channels.addReaction(currentChannel.id, id, emoji);
    }
  };

  const handlePin = async (id: string) => {
    if (currentChannel) {
      await api.channels.pinMessage(currentChannel.id, id);
    }
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-text-primary">Welcome to Harmoniq</h2>
          <p className="text-text-muted mt-2">Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg-primary" role="log" aria-label="Messages" aria-live="polite">
      {/* Channel start */}
      <div className="px-4 pt-6 pb-4">
        <h3 className="text-2xl font-bold text-text-primary">Welcome to #{currentChannel.name}</h3>
        <p className="text-text-muted mt-1">This is the start of the #{currentChannel.name} channel.</p>
      </div>

      {/* Messages */}
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReact={handleReact}
          onPin={handlePin}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
