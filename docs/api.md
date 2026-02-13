# Harmoniq API Documentation

Base URL: `https://<your-domain>/api/v1`

All responses follow the envelope format:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": { "code": "INVALID_TOKEN", "message": "..." } }
```

Authentication is via `Authorization: Bearer <token>` header unless noted otherwise.

---

## Auth

### POST /auth/register

Create a new user account.

**Request:**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "S3cureP@ss!"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "u_abc123",
      "username": "alice",
      "email": "alice@example.com",
      "avatarUrl": null,
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "dGhpcyBp..."
  }
}
```

### POST /auth/login

Authenticate and receive tokens.

**Request:**

```json
{
  "email": "alice@example.com",
  "password": "S3cureP@ss!"
}
```

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "dGhpcyBp...",
    "user": {
      "id": "u_abc123",
      "username": "alice",
      "email": "alice@example.com",
      "avatarUrl": "https://cdn.harmoniq.app/avatars/u_abc123.webp",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

### POST /auth/refresh

Exchange a refresh token for a new access token.

**Request:**

```json
{
  "refreshToken": "dGhpcyBp..."
}
```

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "bmV3IHJl..."
  }
}
```

### GET /auth/me

Return the currently authenticated user.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "id": "u_abc123",
    "username": "alice",
    "email": "alice@example.com",
    "avatarUrl": "https://cdn.harmoniq.app/avatars/u_abc123.webp",
    "status": "online",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## Servers

### POST /servers

Create a new server. Requires authentication.

**Request:**

```json
{
  "name": "My Server",
  "description": "A place to hang out",
  "iconUrl": "https://cdn.harmoniq.app/icons/srv_1.webp"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "id": "srv_xyz789",
    "name": "My Server",
    "description": "A place to hang out",
    "iconUrl": "https://cdn.harmoniq.app/icons/srv_1.webp",
    "ownerId": "u_abc123",
    "createdAt": "2025-01-15T12:00:00Z"
  }
}
```

### GET /servers

List servers the authenticated user has joined.

**Response `200`:**

```json
{
  "ok": true,
  "data": [
    {
      "id": "srv_xyz789",
      "name": "My Server",
      "iconUrl": "https://cdn.harmoniq.app/icons/srv_1.webp",
      "memberCount": 42
    }
  ]
}
```

### GET /servers/:serverId

Get details for a specific server.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "id": "srv_xyz789",
    "name": "My Server",
    "description": "A place to hang out",
    "iconUrl": "https://cdn.harmoniq.app/icons/srv_1.webp",
    "ownerId": "u_abc123",
    "memberCount": 42,
    "createdAt": "2025-01-15T12:00:00Z"
  }
}
```

### GET /servers/:serverId/channels

List channels in a server.

**Response `200`:**

```json
{
  "ok": true,
  "data": [
    {
      "id": "ch_001",
      "name": "general",
      "type": "text",
      "position": 0
    },
    {
      "id": "ch_002",
      "name": "voice-lounge",
      "type": "voice",
      "position": 1
    }
  ]
}
```

### GET /servers/:serverId/members

List members of a server. Supports `?page=1&limit=50`.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "members": [
      {
        "userId": "u_abc123",
        "username": "alice",
        "avatarUrl": "https://cdn.harmoniq.app/avatars/u_abc123.webp",
        "role": "owner",
        "joinedAt": "2025-01-15T12:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 50
  }
}
```

### POST /servers/:serverId/join

Join a server (or accept an invite).

**Request (optional invite code):**

```json
{
  "inviteCode": "abc123"
}
```

**Response `200`:**

```json
{
  "ok": true,
  "data": { "joined": true, "serverId": "srv_xyz789" }
}
```

### DELETE /servers/:serverId/members/:userId (Kick)

Remove a member from the server. Requires `KICK_MEMBERS` permission.

**Response `200`:**

```json
{
  "ok": true,
  "data": { "kicked": true, "userId": "u_target456" }
}
```

### POST /servers/:serverId/bans

Ban a user from the server. Requires `BAN_MEMBERS` permission.

**Request:**

```json
{
  "userId": "u_target456",
  "reason": "Spamming"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "banned": true,
    "userId": "u_target456",
    "reason": "Spamming"
  }
}
```

---

## Channels

### POST /servers/:serverId/channels

Create a channel in a server. Requires `MANAGE_CHANNELS` permission.

**Request:**

```json
{
  "name": "dev-chat",
  "type": "text",
  "topic": "Backend development discussion"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "id": "ch_003",
    "name": "dev-chat",
    "type": "text",
    "topic": "Backend development discussion",
    "serverId": "srv_xyz789",
    "createdAt": "2025-01-16T08:00:00Z"
  }
}
```

### GET /channels/:channelId/messages

Fetch message history. Supports `?before=<messageId>&limit=50`.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "messages": [
      {
        "id": "msg_100",
        "channelId": "ch_001",
        "author": {
          "id": "u_abc123",
          "username": "alice",
          "avatarUrl": "https://cdn.harmoniq.app/avatars/u_abc123.webp"
        },
        "content": "Hello everyone!",
        "attachments": [],
        "reactions": [
          { "emoji": "👋", "count": 3, "me": true }
        ],
        "pinned": false,
        "createdAt": "2025-01-16T09:00:00Z",
        "editedAt": null
      }
    ],
    "hasMore": true
  }
}
```

### POST /channels/:channelId/messages

Send a message. Requires `SEND_MESSAGES` permission.

**Request:**

```json
{
  "content": "Hey, check this out!",
  "attachments": ["att_file1"],
  "replyTo": "msg_099"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "id": "msg_101",
    "channelId": "ch_001",
    "content": "Hey, check this out!",
    "attachments": [
      {
        "id": "att_file1",
        "filename": "screenshot.png",
        "url": "https://cdn.harmoniq.app/uploads/att_file1.png",
        "size": 204800,
        "mimeType": "image/png"
      }
    ],
    "replyTo": "msg_099",
    "createdAt": "2025-01-16T09:05:00Z"
  }
}
```

### PATCH /channels/:channelId/messages/:messageId

Edit a message. Only the author can edit.

**Request:**

```json
{
  "content": "Hey, check this out! (edited)"
}
```

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "id": "msg_101",
    "content": "Hey, check this out! (edited)",
    "editedAt": "2025-01-16T09:10:00Z"
  }
}
```

### DELETE /channels/:channelId/messages/:messageId

Delete a message. Author or users with `MANAGE_MESSAGES` permission.

**Response `200`:**

```json
{
  "ok": true,
  "data": { "deleted": true, "messageId": "msg_101" }
}
```

### PUT /channels/:channelId/messages/:messageId/pin

Pin a message. Requires `MANAGE_MESSAGES` permission.

**Response `200`:**

```json
{
  "ok": true,
  "data": { "pinned": true, "messageId": "msg_100" }
}
```

### PUT /channels/:channelId/messages/:messageId/reactions/:emoji

Add a reaction to a message.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "messageId": "msg_100",
    "emoji": "🔥",
    "count": 5
  }
}
```

### DELETE /channels/:channelId/messages/:messageId/reactions/:emoji

Remove your reaction from a message.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "messageId": "msg_100",
    "emoji": "🔥",
    "count": 4
  }
}
```

### GET /channels/:channelId/messages/search

Search messages in a channel. Supports `?q=keyword&limit=25`.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "results": [
      {
        "id": "msg_100",
        "content": "Hello everyone!",
        "author": { "id": "u_abc123", "username": "alice" },
        "createdAt": "2025-01-16T09:00:00Z",
        "channelId": "ch_001"
      }
    ],
    "total": 1
  }
}
```

---

## Media

### POST /media/upload

Upload a file. Request body is `multipart/form-data`. Max 25 MB per file.

| Field  | Type   | Description               |
|--------|--------|---------------------------|
| `file` | File   | The file to upload        |
| `type` | String | `avatar`, `icon`, `attachment` |

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "id": "att_file1",
    "filename": "screenshot.png",
    "url": "https://cdn.harmoniq.app/uploads/att_file1.png",
    "size": 204800,
    "mimeType": "image/png"
  }
}
```

---

## Bots & Webhooks

### POST /servers/:serverId/bots

Register a bot for a server. Requires `MANAGE_SERVER` permission.

**Request:**

```json
{
  "name": "ModBot",
  "avatarUrl": "https://cdn.harmoniq.app/avatars/bot_mod.webp",
  "permissions": ["SEND_MESSAGES", "MANAGE_MESSAGES"]
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "botId": "bot_001",
    "name": "ModBot",
    "token": "bot.eyJhbGci..."
  }
}
```

### POST /servers/:serverId/webhooks

Create an incoming webhook for a channel. Requires `MANAGE_WEBHOOKS` permission.

**Request:**

```json
{
  "name": "GitHub Notifications",
  "channelId": "ch_001"
}
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "id": "wh_001",
    "name": "GitHub Notifications",
    "url": "https://harmoniq.app/api/v1/webhooks/wh_001/aBcDeFgH",
    "channelId": "ch_001"
  }
}
```

### POST /webhooks/:webhookId/:token

Execute a webhook (no auth header required — the token is in the URL).

**Request:**

```json
{
  "content": "New commit pushed to `main`",
  "username": "GitHub",
  "avatarUrl": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
}
```

**Response `200`:**

```json
{
  "ok": true,
  "data": { "messageId": "msg_200" }
}
```

---

## WebSocket Events

Connect via Socket.IO at `wss://<your-domain>` with `auth: { token: "<accessToken>" }`.

### Client → Server Events

| Event           | Payload                                                       |
|-----------------|---------------------------------------------------------------|
| `channel.join`  | `{ "channelId": "ch_001" }`                                  |
| `channel.leave` | `{ "channelId": "ch_001" }`                                  |
| `typing.start`  | `{ "channelId": "ch_001" }`                                  |
| `typing.stop`   | `{ "channelId": "ch_001" }`                                  |
| `voice.join`    | `{ "channelId": "ch_002" }`                                  |
| `voice.leave`   | `{ "channelId": "ch_002" }`                                  |
| `voice.signal`  | `{ "channelId": "ch_002", "targetUserId": "u_456", "signal": { ... } }` |

### Server → Client Events

#### message.create

```json
{
  "id": "msg_102",
  "channelId": "ch_001",
  "author": {
    "id": "u_abc123",
    "username": "alice",
    "avatarUrl": "https://cdn.harmoniq.app/avatars/u_abc123.webp"
  },
  "content": "Real-time message!",
  "attachments": [],
  "createdAt": "2025-01-16T10:00:00Z"
}
```

#### message.update

```json
{
  "id": "msg_102",
  "channelId": "ch_001",
  "content": "Real-time message! (edited)",
  "editedAt": "2025-01-16T10:05:00Z"
}
```

#### message.delete

```json
{
  "id": "msg_102",
  "channelId": "ch_001"
}
```

#### typing.start

```json
{
  "channelId": "ch_001",
  "user": { "id": "u_abc123", "username": "alice" }
}
```

#### typing.stop

```json
{
  "channelId": "ch_001",
  "user": { "id": "u_abc123", "username": "alice" }
}
```

#### presence.update

```json
{
  "userId": "u_abc123",
  "status": "online",
  "lastSeen": "2025-01-16T10:00:00Z"
}
```

Status values: `online`, `idle`, `dnd`, `offline`.

#### reaction.add

```json
{
  "messageId": "msg_100",
  "channelId": "ch_001",
  "emoji": "🔥",
  "userId": "u_abc123",
  "count": 5
}
```

#### reaction.remove

```json
{
  "messageId": "msg_100",
  "channelId": "ch_001",
  "emoji": "🔥",
  "userId": "u_abc123",
  "count": 4
}
```

#### voice.join

```json
{
  "channelId": "ch_002",
  "user": { "id": "u_abc123", "username": "alice" },
  "participants": ["u_abc123", "u_def456"]
}
```

#### voice.leave

```json
{
  "channelId": "ch_002",
  "user": { "id": "u_abc123", "username": "alice" },
  "participants": ["u_def456"]
}
```

#### voice.signal

```json
{
  "channelId": "ch_002",
  "fromUserId": "u_abc123",
  "signal": {
    "type": "offer",
    "sdp": "v=0\r\no=- ..."
  }
}
```

---

## Error Codes

| Code                  | HTTP | Description                    |
|-----------------------|------|--------------------------------|
| `VALIDATION_ERROR`    | 400  | Invalid request body           |
| `UNAUTHORIZED`        | 401  | Missing or invalid token       |
| `FORBIDDEN`           | 403  | Insufficient permissions       |
| `NOT_FOUND`           | 404  | Resource not found             |
| `CONFLICT`            | 409  | Duplicate resource             |
| `RATE_LIMITED`         | 429  | Too many requests              |
| `INTERNAL_ERROR`      | 500  | Unexpected server error        |

## Rate Limits

| Scope          | Limit              |
|----------------|---------------------|
| Auth endpoints | 5 req / minute      |
| Messages       | 10 req / 10 seconds |
| File uploads   | 3 req / minute      |
| General API    | 60 req / minute     |

Rate limit headers are returned on every response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1705401600
```
