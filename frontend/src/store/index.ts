import { create } from 'zustand';
import type { User, Server, Channel, Message, ServerMember } from '../types';
import { api } from '../services/api';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;

  // Servers
  servers: Server[];
  currentServer: Server | null;
  setCurrentServer: (server: Server | null) => void;
  fetchServers: () => Promise<void>;
  createServer: (name: string, description?: string) => Promise<void>;

  // Channels
  channels: Channel[];
  currentChannel: Channel | null;
  setCurrentChannel: (channel: Channel | null) => void;
  fetchChannels: (serverId: string) => Promise<void>;

  // Messages
  messages: Message[];
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string, editedAt: string) => void;
  removeMessage: (id: string) => void;

  // Members
  members: ServerMember[];
  fetchMembers: (serverId: string) => Promise<void>;

  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  membersPanelOpen: boolean;
  toggleMembersPanel: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const result = await api.auth.login({ email, password });
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    set({ user: result.user, isAuthenticated: true });
  },

  register: async (username, email, password) => {
    const result = await api.auth.register({ username, email, password });
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, servers: [], channels: [], messages: [], members: [] });
  },

  // Servers
  servers: [],
  currentServer: null,
  setCurrentServer: (server) => set({ currentServer: server, channels: [], messages: [], currentChannel: null }),

  fetchServers: async () => {
    const servers = await api.servers.list();
    set({ servers });
  },

  createServer: async (name, description) => {
    const server = await api.servers.create({ name, description });
    set((state) => ({ servers: [...state.servers, server] }));
  },

  // Channels
  channels: [],
  currentChannel: null,
  setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [] }),

  fetchChannels: async (serverId) => {
    const channels = await api.servers.channels(serverId);
    set({ channels });
  },

  // Messages
  messages: [],
  fetchMessages: async (channelId) => {
    const messages = await api.channels.messages(channelId);
    set({ messages });
  },

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, content, editedAt) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content, edited_at: editedAt } : m)),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  // Members
  members: [],
  fetchMembers: async (serverId) => {
    const members = await api.servers.members(serverId);
    set({ members });
  },

  // UI
  darkMode: localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () => {
    const newMode = !get().darkMode;
    localStorage.setItem('darkMode', String(newMode));
    set({ darkMode: newMode });
  },
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  membersPanelOpen: true,
  toggleMembersPanel: () => set((state) => ({ membersPanelOpen: !state.membersPanelOpen })),
}));
