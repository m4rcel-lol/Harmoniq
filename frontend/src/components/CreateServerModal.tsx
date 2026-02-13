import { useState, type FormEvent } from 'react';
import { useStore } from '../store';

export function CreateServerModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { createServer, fetchServers } = useStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createServer(name.trim(), description.trim());
      await fetchServers();
      onClose();
    } catch (err) {
      console.error('Failed to create server:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-bg-secondary rounded-[var(--radius-md)] p-6 w-full max-w-md shadow-[var(--shadow-elevation-3)] border border-border animate-fade-in">
        <h2 className="text-xl font-bold text-text-primary mb-4">Create a Server</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="serverName" className="block text-sm font-medium text-text-primary mb-1">
              Server Name
            </label>
            <input
              id="serverName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-harmoniq-blue"
              placeholder="My awesome server"
              required
              maxLength={100}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="serverDesc" className="block text-sm font-medium text-text-primary mb-1">
              Description (optional)
            </label>
            <textarea
              id="serverDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-harmoniq-blue resize-none"
              placeholder="What is this server about?"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--radius-sm)] bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-[var(--radius-sm)] bg-harmoniq-blue text-white text-sm font-medium hover:bg-harmoniq-blue-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
