import { useStore } from '../store';
import type { Server } from '../types';

export function ServerList() {
  const { servers, currentServer, setCurrentServer, fetchChannels, fetchMembers } = useStore();

  const handleServerClick = async (server: Server) => {
    setCurrentServer(server);
    await fetchChannels(server.id);
    await fetchMembers(server.id);
  };

  return (
    <nav
      className="flex flex-col items-center w-[72px] bg-bg-tertiary py-3 gap-2 overflow-y-auto"
      role="navigation"
      aria-label="Server list"
    >
      {/* Home button */}
      <button
        onClick={() => setCurrentServer(null)}
        className="w-12 h-12 rounded-[var(--radius-md)] bg-harmoniq-blue text-white flex items-center justify-center font-bold text-lg hover:rounded-[var(--radius-sm)] transition-all duration-200"
        aria-label="Home"
        title="Home"
      >
        H
      </button>

      <div className="w-8 h-0.5 bg-border rounded-full" />

      {/* Server icons */}
      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => handleServerClick(server)}
          className={`w-12 h-12 rounded-[var(--radius-pill)] flex items-center justify-center font-semibold text-sm transition-all duration-200 hover:rounded-[var(--radius-md)] ${
            currentServer?.id === server.id
              ? 'bg-harmoniq-blue text-white rounded-[var(--radius-md)]'
              : 'bg-bg-secondary text-text-secondary hover:bg-harmoniq-blue-light hover:text-white'
          }`}
          aria-label={server.name}
          title={server.name}
        >
          {server.icon_url ? (
            <img src={server.icon_url} alt={server.name} className="w-full h-full rounded-inherit object-cover" />
          ) : (
            server.name.substring(0, 2).toUpperCase()
          )}
        </button>
      ))}
    </nav>
  );
}
