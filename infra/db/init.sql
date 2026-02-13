-- Harmoniq Database Initialization Script
-- This script is automatically run by PostgreSQL on first startup

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL,
  display_name VARCHAR(64),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  totp_secret VARCHAR(64),
  totp_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servers (guilds)
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  icon_url TEXT,
  description TEXT,
  invite_code VARCHAR(16) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  color VARCHAR(7),
  permissions JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Server members
CREATE TABLE IF NOT EXISTS server_members (
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(64),
  role_ids UUID[] DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (server_id, user_id)
);

-- Channels
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'broadcast', 'dm', 'group')),
  name VARCHAR(100),
  topic TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel members (for DMs and groups)
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT,
  content_json JSONB,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  encryption_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename VARCHAR(255),
  mime_type VARCHAR(128),
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  emoji VARCHAR(64) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, emoji, user_id)
);

-- Audit / moderation logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(32),
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bots
CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(64) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_server_id ON audit_logs(server_id, created_at DESC);

-- Full-text search index on messages
CREATE INDEX IF NOT EXISTS idx_messages_content_fts ON messages USING gin(to_tsvector('english', coalesce(content, '')));
