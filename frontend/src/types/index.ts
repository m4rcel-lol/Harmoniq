export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  last_seen: string;
  created_at: string;
}

export interface Server {
  id: string;
  owner_id: string;
  name: string;
  icon_url: string | null;
  description: string;
  invite_code: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Channel {
  id: string;
  server_id: string | null;
  type: 'text' | 'voice' | 'broadcast' | 'dm' | 'group';
  name: string;
  topic: string;
  is_private: boolean;
  position: number;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  author_username: string;
  author_display_name: string;
  author_avatar: string | null;
  reply_to_id: string | null;
  is_pinned: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  attachments: Attachment[];
  reactions: Reaction[];
}

export interface Attachment {
  id: string;
  message_id: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
}

export interface Reaction {
  emoji: string;
  user_ids: string[];
  count: number;
}

export interface ServerMember {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  last_seen: string;
  nickname: string | null;
  joined_at: string;
  role_ids: string[];
}
