# Harmoniq

A modern web communicator merging the best of Discord and Telegram into one original product.

## Architecture

- **Frontend**: React + Vite (TypeScript) + TailwindCSS + Harmoniq Material design system (PWA)
- **Backend**: Node.js + Express + TypeScript + Socket.IO
- **Database**: PostgreSQL + Redis
- **File Storage**: MinIO (S3-compatible)
- **WebRTC**: coturn TURN/STUN server
- **Reverse Proxy**: nginx with TLS termination

## Quick Start

```bash
# Development
docker compose -f docker-compose.yml up -d --build

# View logs
docker compose logs -f backend
```

## Project Structure

```
/frontend    - React/TypeScript + Harmoniq Material components
/backend     - Node.js/TypeScript REST + WebSocket server
/infra       - Docker configs, nginx, coturn, DB init scripts
/docs        - Design tokens, API docs, deploy guides
/examples    - Sample bot, Postman collection, mock data
```

## Documentation

- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deploy.md)
- [Design System](docs/design-tokens.md)
- [Maintainer Guide](docs/maintainer.md)
- [Security & E2EE](docs/security.md)
- [Developer Plan](docs/milestones.md)
