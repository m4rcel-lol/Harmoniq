# Harmoniq Security & Privacy

This document describes the security architecture, encryption design, and privacy practices for Harmoniq.

---

## TLS / HTTPS

All traffic between clients and the server is encrypted with TLS 1.2+ (TLS 1.3 preferred).

### Configuration

TLS is terminated at the nginx reverse proxy. Recommended cipher configuration:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### HSTS

Enable HTTP Strict Transport Security:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Internal Traffic

Container-to-container traffic within the Docker bridge network is not encrypted by default. For high-security deployments, consider enabling mTLS between services using a service mesh.

---

## Input Sanitization

### Server-Side

- All user input is validated against JSON Schema before processing.
- Message content is sanitized with a strict allowlist of Markdown constructs.
- File uploads are validated by MIME type (checked via magic bytes, not extension) and restricted to an allowlist: images, audio, video, PDF, and common document formats.
- File names are normalized (stripped of path separators, null bytes, and special characters).
- SQL queries use parameterized statements exclusively — no string concatenation.

### Client-Side

- User-generated content is rendered via React's built-in XSS protection (JSX escaping).
- Markdown rendering uses a sanitized renderer that strips `<script>`, `<iframe>`, `on*` attributes, and `javascript:` URLs.
- URLs in messages are validated before rendering as clickable links.

---

## Rate Limiting

Rate limits are enforced at the nginx and application layers using a sliding window algorithm backed by Redis.

| Endpoint Category | Limit              | Window    |
|-------------------|--------------------|-----------|
| Auth (login/register) | 5 requests     | 1 minute  |
| Message send      | 10 requests        | 10 seconds |
| File upload       | 3 requests         | 1 minute  |
| General API       | 60 requests        | 1 minute  |
| WebSocket events  | 30 events          | 10 seconds |

Clients exceeding limits receive `429 Too Many Requests` with a `Retry-After` header.

### nginx Layer

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

location /api/v1/auth/ {
    limit_req zone=auth burst=3 nodelay;
}

location /api/v1/ {
    limit_req zone=api burst=20 nodelay;
}
```

---

## CSRF Protection

- The API is stateless and token-based (JWT in `Authorization` header), which is inherently resistant to CSRF.
- Cookies are **not** used for authentication.
- For defense-in-depth, the `Origin` header is validated on all state-changing requests.
- CORS is restricted to the configured `CORS_ORIGIN` value:

  ```
  Access-Control-Allow-Origin: https://your-domain.com
  Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
  Access-Control-Allow-Headers: Authorization, Content-Type
  Access-Control-Allow-Credentials: false
  ```

---

## JWT Security

### Token Design

| Token Type    | Lifetime | Storage (Client)            |
|---------------|----------|-----------------------------|
| Access Token  | 15 min   | In-memory only              |
| Refresh Token | 7 days   | `httpOnly` secure cookie or secure storage |

### Claims

```json
{
  "sub": "u_abc123",
  "iat": 1705312000,
  "exp": 1705312900,
  "iss": "harmoniq",
  "aud": "harmoniq-client"
}
```

### Best Practices

- Tokens are signed with HS256 using a 256-bit+ secret.
- The `alg: none` attack is mitigated by explicitly verifying the algorithm.
- Refresh tokens are stored in the database with a hash — if compromised, they can be revoked per-user or globally.
- Token rotation: each refresh request invalidates the previous refresh token (one-time use).
- On password change, all existing refresh tokens for that user are invalidated.

---

## End-to-End Encryption (E2EE)

### Overview

Harmoniq offers optional E2EE for direct messages and private group channels. Server-side, messages are stored as opaque ciphertext — the server never has access to plaintext content or encryption keys.

### Protocol: Double Ratchet

E2EE uses the Double Ratchet Algorithm (Signal Protocol) with the following primitives:

| Component            | Algorithm             |
|----------------------|-----------------------|
| Identity keys        | X25519                |
| Ratchet              | Double Ratchet (Axolotl) |
| Message encryption   | AES-256-GCM           |
| Key derivation       | HKDF-SHA-256          |
| Signatures           | Ed25519               |

### Key Management

1. **Identity Key Pair:** Generated on device, the private key never leaves the device.
2. **Signed Pre-Key:** Rotated every 7 days, signed with the identity key.
3. **One-Time Pre-Keys:** A batch of 100 ephemeral keys uploaded to the server. Used once per session establishment.
4. **Session Key:** Derived via X3DH (Extended Triple Diffie-Hellman) key agreement, then ratcheted forward with each message.

### Key Storage

- Private keys are stored in the browser's `IndexedDB`, encrypted with a key derived from the user's password via Argon2id.
- On mobile (future), keys are stored in the platform secure enclave (iOS Keychain / Android Keystore).

### Multi-Device Support

Each device has its own identity key pair. Messages are encrypted separately for each device. Users can view and revoke device keys in their security settings.

### Trade-Offs

| Feature                | With E2EE           | Without E2EE         |
|------------------------|---------------------|----------------------|
| Server-side search     | ❌ Not possible      | ✅ Full-text search   |
| Message preview (push) | ❌ Generic notification | ✅ Content preview |
| Link previews          | Client-side only    | Server-generated     |
| Moderation / reporting | Limited (see below) | Full content access  |
| Message sync           | Requires key sync   | Automatic            |

---

## GDPR Compliance

### Data Minimization

- Only essential data is collected: username, email, hashed password, messages, and uploaded files.
- IP addresses are logged for rate limiting and abuse prevention but are rotated out after 30 days.
- Analytics, if enabled, use privacy-preserving aggregation (no personal identifiers).

### User Rights

| Right                  | Implementation                                           |
|------------------------|----------------------------------------------------------|
| Access (Art. 15)       | `GET /auth/me` + data export endpoint                    |
| Rectification (Art. 16)| `PATCH /users/me` to update profile                      |
| Erasure (Art. 17)      | `DELETE /users/me` — deletes account, messages anonymized |
| Portability (Art. 20)  | `GET /users/me/export` — JSON/ZIP download               |
| Restriction (Art. 18)  | Account deactivation without deletion                     |

### Data Retention

| Data Type       | Retention           |
|-----------------|---------------------|
| Messages        | Indefinite (user-deletable) |
| Deleted messages| Purged after 30 days |
| Access logs     | 30 days             |
| Account data    | Until deletion request + 30 day grace period |

### Consent

- Registration requires explicit consent to Terms of Service and Privacy Policy.
- Optional features (analytics, read receipts) require separate opt-in.

---

## Moderation vs E2EE

E2EE channels present a fundamental tension with content moderation. Harmoniq handles this as follows:

### Report Mechanism

- Users can **forward-report** a message: the reporting user voluntarily shares the decrypted message content with moderators.
- The server attaches metadata (reporter ID, timestamp, channel) but does not have independent access to the content.

### Server-Wide Policies

- Server owners can choose to **disable E2EE** for specific channels where moderation is a priority.
- Non-E2EE channels support server-side content filters (spam, slurs, link scanning).
- Admins cannot retroactively decrypt E2EE messages.

### Abuse Prevention

- Rate limiting and behavioral analysis (message frequency, join patterns) operate on metadata, not content.
- Known CSAM hash matching (PhotoDNA-style) is only possible in non-E2EE channels.
- Users can block other users client-side regardless of E2EE status.

---

## Additional Security Headers

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "0" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.harmoniq.app; connect-src 'self' wss://*.harmoniq.app; font-src 'self'; object-src 'none'; frame-ancestors 'none';" always;
```

---

## Vulnerability Disclosure

Security issues can be reported to `security@harmoniq.app`. We follow a 90-day responsible disclosure timeline and aim to acknowledge reports within 48 hours.
