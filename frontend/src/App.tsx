import { useEffect, useState } from 'react';
import { useStore } from './store';
import { connectSocket, getSocket, disconnectSocket } from './services/socket';
import { AuthPage } from './pages/AuthPage';
import { ServerList } from './components/ServerList';
import { ChannelList } from './components/ChannelList';
import { ChannelHeader } from './components/ChannelHeader';
import { MessageList } from './components/MessageList';
import { Composer } from './components/Composer';
import { MemberPresenceList } from './components/MemberPresenceList';
import { VoiceRoomPanel } from './components/VoiceRoomPanel';
import { CreateServerModal } from './components/CreateServerModal';

function App() {
  const { isAuthenticated, darkMode, currentChannel, fetchServers, addMessage, updateMessage, removeMessage, setUser } = useStore();
  const [showCreateServer, setShowCreateServer] = useState(false);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // On auth, load user data and connect socket
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Fetch user profile & servers
    import('./services/api').then(({ api }) => {
      api.auth.me().then((user) => setUser(user)).catch(console.error);
      fetchServers().catch(console.error);
    });

    // Connect WebSocket
    const socket = connectSocket(token);

    socket.on('message.create', (msg) => addMessage(msg));
    socket.on('message.update', (data) => updateMessage(data.id, data.content, data.editedAt));
    socket.on('message.delete', (data) => removeMessage(data.id));

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  // Join channel room when switching channels
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !currentChannel) return;

    socket.emit('channel.join', currentChannel.id);
    return () => {
      socket.emit('channel.leave', currentChannel.id);
    };
  }, [currentChannel]);

  if (!isAuthenticated) {
    return <AuthPage onSuccess={() => {}} />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-bg-primary">
      {/* Server list */}
      <ServerList />

      {/* Channel list */}
      <ChannelList />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChannelHeader />
        {currentChannel?.type === 'voice' ? <VoiceRoomPanel /> : <MessageList />}
        <Composer />
      </main>

      {/* Members panel */}
      {currentChannel && <MemberPresenceList />}

      {/* Create server modal */}
      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} />}

      {/* Floating create server button */}
      {!showCreateServer && (
        <button
          onClick={() => setShowCreateServer(true)}
          className="fixed bottom-6 left-4 w-12 h-12 rounded-[var(--radius-pill)] bg-harmoniq-blue text-white flex items-center justify-center text-2xl shadow-[var(--shadow-elevation-2)] hover:bg-harmoniq-blue-dark transition-colors z-40"
          aria-label="Create server"
          title="Create a new server"
        >
          +
        </button>
      )}
    </div>
  );
}

export default App;
