import { useStore } from '../store';

export function MemberPresenceList() {
  const { members, membersPanelOpen } = useStore();

  if (!membersPanelOpen) return null;

  const onlineMembers = members.filter((m) => m.status === 'online' || m.status === 'idle' || m.status === 'dnd');
  const offlineMembers = members.filter((m) => m.status === 'offline');

  const statusColors: Record<string, string> = {
    online: 'bg-success',
    idle: 'bg-warning',
    dnd: 'bg-danger',
    offline: 'bg-text-muted',
  };

  return (
    <aside className="w-60 bg-bg-secondary border-l border-border overflow-y-auto" role="complementary" aria-label="Member list">
      <div className="p-3">
        {/* Online members */}
        {onlineMembers.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wide px-1 mb-2">
              Online — {onlineMembers.length}
            </h3>
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-[var(--radius-pill)] object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-[var(--radius-pill)] bg-harmoniq-blue-light flex items-center justify-center text-white text-xs font-semibold">
                      {(member.display_name || member.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-secondary ${statusColors[member.status] || 'bg-text-muted'}`} />
                </div>
                <span className="text-sm text-text-primary truncate">
                  {member.nickname || member.display_name || member.username}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Offline members */}
        {offlineMembers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wide px-1 mb-2">
              Offline — {offlineMembers.length}
            </h3>
            {offlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-bg-tertiary transition-colors cursor-pointer opacity-50"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-[var(--radius-pill)] bg-bg-tertiary flex items-center justify-center text-text-muted text-xs font-semibold">
                    {(member.display_name || member.username).charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-secondary bg-text-muted" />
                </div>
                <span className="text-sm text-text-muted truncate">
                  {member.nickname || member.display_name || member.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
