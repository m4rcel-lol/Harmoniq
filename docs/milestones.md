# Harmoniq Developer Plan & Milestones

A phased roadmap for building Harmoniq from scaffold to production.

---

## Milestone 1: Scaffold & Setup

**Goal:** Repository structure, tooling, and local development environment.

- [x] Initialize monorepo with `frontend/`, `backend/`, `infra/`, `docs/`, `examples/`
- [x] Configure `docker-compose.yml` with all services (nginx, backend, postgres, redis, minio, coturn)
- [x] Create `.env.example` with all required environment variables
- [x] Set up backend: Node.js + TypeScript + Express + Jest
- [x] Set up frontend: React + Vite + TypeScript + TailwindCSS
- [x] Configure ESLint, Prettier, and shared editor settings
- [ ] Set up CI/CD pipeline (GitHub Actions: lint, test, build, deploy)
- [ ] Add pre-commit hooks (Husky + lint-staged)

**Deliverables:** `docker compose up` starts all services; frontend and backend dev servers run locally.

---

## Milestone 2: Auth & User Management

**Goal:** User registration, login, JWT-based auth, and profile management.

- [ ] Database schema: `users` table with id, username, email, password_hash, avatar_url, created_at
- [ ] `POST /auth/register` — validate input, hash password (bcrypt), create user, return tokens
- [ ] `POST /auth/login` — verify credentials, return access + refresh tokens
- [ ] `POST /auth/refresh` — rotate refresh token, return new access token
- [ ] `GET /auth/me` — return authenticated user profile
- [ ] JWT middleware: verify access token on protected routes
- [ ] Refresh token storage in database with revocation support
- [ ] `PATCH /users/me` — update username, avatar, status
- [ ] `DELETE /users/me` — account deletion (anonymize messages, purge data after 30 days)
- [ ] Input validation middleware (express-validator or Zod)
- [ ] Rate limiting on auth endpoints (5 req/min)
- [ ] Unit tests for auth flows

**Deliverables:** Users can register, log in, refresh tokens, and manage their profile.

---

## Milestone 3: Servers, Channels & Messages

**Goal:** Core communication features — servers, channels, messages, reactions.

- [ ] Database schema: `servers`, `channels`, `messages`, `server_members`, `reactions` tables
- [ ] `POST /servers` — create a server
- [ ] `GET /servers` — list joined servers
- [ ] `GET /servers/:id` — server details
- [ ] `POST /servers/:id/join` — join a server (with optional invite code)
- [ ] `DELETE /servers/:id/members/:userId` — kick a member
- [ ] `POST /servers/:id/bans` — ban a user
- [ ] `POST /servers/:id/channels` — create a channel (text or voice)
- [ ] `GET /servers/:id/channels` — list channels
- [ ] `GET /channels/:id/messages` — paginated message history (cursor-based)
- [ ] `POST /channels/:id/messages` — send a message (with optional reply-to)
- [ ] `PATCH /channels/:id/messages/:msgId` — edit a message
- [ ] `DELETE /channels/:id/messages/:msgId` — delete a message
- [ ] `PUT /channels/:id/messages/:msgId/pin` — pin/unpin a message
- [ ] `PUT /channels/:id/messages/:msgId/reactions/:emoji` — add reaction
- [ ] `DELETE /channels/:id/messages/:msgId/reactions/:emoji` — remove reaction
- [ ] `GET /channels/:id/messages/search` — full-text message search
- [ ] Permission system: role-based (owner, admin, moderator, member)
- [ ] Invite link generation and validation
- [ ] Integration tests for CRUD operations

**Deliverables:** Full server/channel/message CRUD with permissions and search.

---

## Milestone 4: Real-time & WebSocket

**Goal:** Live messaging, typing indicators, presence, and reactions via WebSocket.

- [ ] Socket.IO server with JWT authentication
- [ ] Redis adapter for horizontal scaling (pub/sub across instances)
- [ ] Room management: join/leave channel rooms
- [ ] `message.create` — broadcast new messages to channel subscribers
- [ ] `message.update` — broadcast edits
- [ ] `message.delete` — broadcast deletions
- [ ] `typing.start` / `typing.stop` — typing indicators with auto-timeout (8s)
- [ ] `presence.update` — online/idle/dnd/offline status, last seen
- [ ] `reaction.add` / `reaction.remove` — live reaction updates
- [ ] Connection lifecycle: reconnection, backoff, session resumption
- [ ] Rate limiting on WebSocket events (30 events/10s)
- [ ] Unit tests for event handlers

**Deliverables:** Real-time messaging, typing, presence, and reactions work across multiple clients.

---

## Milestone 5: File Upload & MinIO

**Goal:** Avatar, server icon, and message attachment uploads via MinIO.

- [ ] `POST /media/upload` — multipart upload to MinIO
- [ ] MIME type validation via magic bytes
- [ ] File size limits (25 MB per file)
- [ ] Image processing: generate thumbnails (sharp or similar)
- [ ] Serve files via presigned URLs with expiry
- [ ] Link uploaded attachments to messages
- [ ] Avatar and server icon upload flows
- [ ] Cleanup job: remove orphaned uploads older than 24 hours
- [ ] Integration tests for upload and retrieval

**Deliverables:** Users can upload and share files; images show inline with thumbnails.

---

## Milestone 6: Voice & Video (coturn + WebRTC)

**Goal:** Voice and video channels using WebRTC with coturn for NAT traversal.

- [ ] coturn configuration: TURN/STUN with shared secret auth
- [ ] `voice.join` / `voice.leave` — join/leave voice channels
- [ ] `voice.signal` — relay SDP offers/answers and ICE candidates via WebSocket
- [ ] Generate TURN credentials from shared secret (time-limited, HMAC-based)
- [ ] Peer connection management on the client (RTCPeerConnection)
- [ ] SFU consideration: evaluate mediasoup or Janus for large rooms (future)
- [ ] Mute/deafen controls
- [ ] Voice activity detection UI
- [ ] Manual testing plan for voice/video across browsers

**Deliverables:** 1-on-1 and small group voice/video calls work across NAT.

---

## Milestone 7: Bots & Webhooks API

**Goal:** Bot accounts and incoming webhooks for third-party integrations.

- [ ] `POST /servers/:id/bots` — register a bot, return a bot token
- [ ] Bot authentication: `Bot <token>` header
- [ ] Bot permissions: scoped to granted permissions only
- [ ] `POST /servers/:id/webhooks` — create incoming webhook for a channel
- [ ] `POST /webhooks/:id/:token` — execute a webhook (no auth header needed)
- [ ] Webhook payload validation and rate limiting
- [ ] Example bot: moderation bot (auto-delete messages matching patterns)
- [ ] Postman collection for bot/webhook endpoints
- [ ] Documentation: bot development guide

**Deliverables:** Third-party services can send messages via webhooks; bots can interact with the API.

---

## Milestone 8: Documentation & Infrastructure

**Goal:** Complete documentation, production infrastructure, and deployment guides.

- [x] `docs/api.md` — REST and WebSocket API reference
- [x] `docs/deploy.md` — Production deployment on Alpine Linux
- [x] `docs/design-tokens.md` — Harmoniq Material design system
- [x] `docs/maintainer.md` — Operational maintenance procedures
- [x] `docs/security.md` — Security architecture and E2EE design
- [x] `docs/milestones.md` — This roadmap
- [ ] `examples/` — Sample bot, Postman collection, mock data
- [ ] nginx configuration: rate limiting, caching, WebSocket proxy
- [ ] Dockerfile optimization: multi-stage builds, minimal images
- [ ] Health check endpoints (`GET /health`)
- [ ] Graceful shutdown handling

**Deliverables:** A developer can clone the repo, read the docs, and deploy to production.

---

## Milestone 9: Testing & Monitoring

**Goal:** Comprehensive test coverage and production observability.

- [ ] Unit tests: ≥ 80% coverage on backend business logic
- [ ] Integration tests: auth flows, CRUD operations, WebSocket events
- [ ] E2E tests: Playwright for critical user journeys (register → join server → send message)
- [ ] Load testing: k6 scripts for API and WebSocket under 1000 concurrent users
- [ ] Prometheus metrics endpoint (`GET /metrics`)
- [ ] Grafana dashboards: request latency, WebSocket connections, DB pool, Redis memory
- [ ] Alerting rules: latency > 500ms, error rate > 1%, disk > 85%
- [ ] Structured logging (JSON format) with correlation IDs
- [ ] Error tracking integration (Sentry or equivalent)
- [ ] CI pipeline: run tests on every PR, block merge on failure

**Deliverables:** Automated test suite runs in CI; production is monitored with alerts.

---

## Unknowns & Trade-offs

### Open Questions

1. **E2EE scope:** Should E2EE be enabled by default for DMs, or opt-in? Enabling by default is more secure but complicates search, notifications, and moderation.

2. **SFU vs Mesh:** WebRTC mesh works for small groups (≤ 4 users). For larger voice channels, a Selective Forwarding Unit (mediasoup, Janus) is needed. This adds significant infrastructure complexity.

3. **Federation:** Should Harmoniq support federation (like Matrix)? This would allow interoperability between independent Harmoniq instances but adds protocol complexity and moderation challenges.

4. **Mobile apps:** React Native, Flutter, or PWA-only? PWA reduces development cost but limits push notification reliability and platform integration on iOS.

5. **Message storage limits:** Should free servers have a message history limit (e.g., last 10,000 messages)? This affects database growth and backup costs.

### Key Trade-offs

| Decision                          | Choice                        | Trade-off                              |
|-----------------------------------|-------------------------------|----------------------------------------|
| Auth mechanism                    | JWT (stateless)               | Fast validation but harder to revoke instantly |
| Database                          | PostgreSQL                    | Strong consistency; more complex scaling than NoSQL |
| File storage                      | MinIO (self-hosted S3)        | Full control but requires backup management |
| Real-time transport               | Socket.IO                     | Broad browser support; slightly heavier than raw WS |
| WebRTC topology                   | Mesh (initially)              | Simple but caps at ~4 participants     |
| Frontend framework                | React + Vite                  | Mature ecosystem; larger bundle than Svelte/Solid |
| E2EE protocol                     | Double Ratchet                | Strong forward secrecy; complex key management |
| Deployment                        | Docker Compose                | Simple single-server; not Kubernetes-ready out of box |

### Technical Debt to Watch

- **Database migrations:** Currently using raw SQL files. Consider adopting a migration tool (Prisma Migrate, Knex, or node-pg-migrate) before Milestone 3.
- **Monorepo tooling:** As the project grows, consider Turborepo or Nx for build caching and task orchestration.
- **Type safety:** Share API types between frontend and backend (e.g., via a shared `types/` package or OpenAPI codegen).
