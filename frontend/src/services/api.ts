const API_BASE = '/api/v1';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        headers['Authorization'] = `Bearer ${data.accessToken}`;
        const retryRes = await fetch(`${API_BASE}${url}`, { ...options, headers });
        if (!retryRes.ok) throw new Error(`API error: ${retryRes.status}`);
        return retryRes.json();
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string; displayName?: string }) =>
      request<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<any>('/auth/me'),
  },
  servers: {
    list: () => request<any[]>('/servers'),
    get: (id: string) => request<any>(`/servers/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<any>('/servers', { method: 'POST', body: JSON.stringify(data) }),
    channels: (id: string) => request<any[]>(`/servers/${id}/channels`),
    members: (id: string) => request<any[]>(`/servers/${id}/members`),
    join: (id: string, inviteCode: string) =>
      request<any>(`/servers/${id}/join`, { method: 'POST', body: JSON.stringify({ inviteCode }) }),
    kick: (id: string, userId: string) =>
      request<any>(`/servers/${id}/kick`, { method: 'POST', body: JSON.stringify({ userId }) }),
    ban: (id: string, userId: string, reason?: string) =>
      request<any>(`/servers/${id}/ban`, { method: 'POST', body: JSON.stringify({ userId, reason }) }),
  },
  channels: {
    create: (data: { serverId: string; name: string; type?: string; topic?: string }) =>
      request<any>('/channels', { method: 'POST', body: JSON.stringify(data) }),
    messages: (id: string, before?: string) =>
      request<any[]>(`/channels/${id}/messages${before ? `?before=${before}` : ''}`),
    sendMessage: (channelId: string, content: string, replyToId?: string) =>
      request<any>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content, replyToId }) }),
    editMessage: (channelId: string, messageId: string, content: string) =>
      request<any>(`/channels/${channelId}/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    deleteMessage: (channelId: string, messageId: string) =>
      request<any>(`/channels/${channelId}/messages/${messageId}`, { method: 'DELETE' }),
    addReaction: (channelId: string, messageId: string, emoji: string) =>
      request<any>(`/channels/${channelId}/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
    removeReaction: (channelId: string, messageId: string, emoji: string) =>
      request<any>(`/channels/${channelId}/messages/${messageId}/reactions/${emoji}`, { method: 'DELETE' }),
    pinMessage: (channelId: string, messageId: string) =>
      request<any>(`/channels/${channelId}/messages/${messageId}/pin`, { method: 'POST' }),
    search: (channelId: string, query: string) =>
      request<any[]>(`/channels/${channelId}/search?q=${encodeURIComponent(query)}`),
  },
};
