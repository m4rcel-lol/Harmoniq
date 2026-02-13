# Harmoniq Maintainer Guide

Operational procedures for maintaining a production Harmoniq deployment.

---

## Secret Rotation

### JWT Secrets

1. Generate a new secret:

   ```bash
   openssl rand -base64 48
   ```

2. Update `.env` with the new `JWT_SECRET` value.

3. Restart the backend — existing tokens signed with the old secret will expire naturally (access tokens: 15 min, refresh tokens: 7 days):

   ```bash
   docker compose up -d --no-deps backend
   ```

4. For an immediate forced logout of all users, also clear the Redis session store:

   ```bash
   docker compose exec redis redis-cli FLUSHDB
   ```

### Database Password

1. Update the password in PostgreSQL:

   ```bash
   docker compose exec postgres psql -U harmoniq -c \
     "ALTER USER harmoniq WITH PASSWORD 'new-strong-password';"
   ```

2. Update `DB_PASSWORD` in `.env`.

3. Restart the backend:

   ```bash
   docker compose up -d --no-deps backend
   ```

### MinIO Keys

1. Update `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in `.env`.

2. Restart MinIO and the backend:

   ```bash
   docker compose up -d --no-deps minio backend
   ```

### TURN Server Secret

1. Update `COTURN_SECRET` in `.env`.

2. Restart coturn:

   ```bash
   docker compose up -d --no-deps coturn
   ```

---

## Database Backup & Restore

### Manual Backup

```bash
docker compose exec -T postgres \
  pg_dump -U harmoniq -d harmoniq --format=custom \
  > backups/db_$(date +%Y%m%d_%H%M%S).dump
```

### Automated Daily Backup

Add to root's crontab (`crontab -e`):

```cron
0 2 * * * cd /opt/harmoniq && docker compose exec -T postgres pg_dump -U harmoniq -d harmoniq --format=custom > /opt/backups/db_$(date +\%Y\%m\%d).dump 2>&1 | logger -t harmoniq-backup
```

### Restore

```bash
# Stop the backend to prevent writes during restore
docker compose stop backend

# Restore
docker compose exec -T postgres \
  pg_restore -U harmoniq -d harmoniq --clean --if-exists \
  < backups/db_20250115.dump

# Restart
docker compose start backend
```

### Point-in-Time Recovery

For WAL-based PITR, configure `archive_mode = on` in PostgreSQL and store WAL files off-server. See the [PostgreSQL PITR documentation](https://www.postgresql.org/docs/15/continuous-archiving.html).

---

## MinIO Backup

### Using MinIO Client (mc)

```bash
# Configure mc alias (one-time)
docker compose exec minio mc alias set local http://localhost:9000 harmoniq harmoniq_secret

# Mirror bucket to a host directory
docker run --rm \
  -v /opt/backups/minio:/backup \
  --network harmoniq_harmoniq \
  minio/mc mirror local/harmoniq-uploads /backup/

# Verify backup integrity
ls -lhR /opt/backups/minio/
```

### Automated Weekly Backup

```cron
0 3 * * 0 docker run --rm -v /opt/backups/minio:/backup --network harmoniq_harmoniq minio/mc mirror --overwrite local/harmoniq-uploads /backup/ 2>&1 | logger -t harmoniq-minio-backup
```

---

## Service Upgrades

### Application Update

```bash
cd /opt/harmoniq
git pull origin main

# Rebuild only changed services
docker compose build backend
docker compose up -d --no-deps backend

# Run pending database migrations
docker compose exec -T postgres \
  psql -U harmoniq -d harmoniq < ./infra/db/migrations/latest.sql
```

### Infrastructure Update (PostgreSQL, Redis, etc.)

1. Take a full database backup.
2. Update the image tag in `docker-compose.yml`.
3. Pull and restart:

   ```bash
   docker compose pull postgres
   docker compose up -d --no-deps postgres
   ```

4. Verify the service is healthy:

   ```bash
   docker compose ps
   docker compose exec postgres psql -U harmoniq -c "SELECT version();"
   ```

### Rolling Back

```bash
# Revert to previous commit
git checkout <previous-commit-sha>
docker compose up -d --build backend

# Or restore a database backup if schema changed
docker compose exec -T postgres \
  pg_restore -U harmoniq -d harmoniq --clean < backups/db_pre_upgrade.dump
```

---

## Scaling WebSocket Workers

The backend uses Socket.IO with Redis adapter for horizontal scaling.

### Add More Backend Replicas

```bash
docker compose up -d --scale backend=3
```

Ensure nginx is configured to load-balance across replicas with sticky sessions (IP hash):

```nginx
upstream backend {
    ip_hash;
    server backend:4000;
}
```

### Redis Pub/Sub Capacity

Monitor Redis memory usage:

```bash
docker compose exec redis redis-cli INFO memory | grep used_memory_human
```

If approaching the 256 MB limit, increase `maxmemory` in `docker-compose.yml`:

```yaml
command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

---

## Monitoring with Prometheus & Grafana

### Setup

Add the monitoring stack to `docker-compose.yml` or a separate overlay file:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9090:9090"
    networks:
      - harmoniq

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"
    networks:
      - harmoniq
```

### Key Metrics to Monitor

| Metric                            | Source       | Alert Threshold         |
|-----------------------------------|-------------|-------------------------|
| HTTP request latency (p95)        | Backend     | > 500ms                 |
| WebSocket active connections      | Backend     | > 80% of capacity      |
| PostgreSQL active connections     | PostgreSQL  | > 80% of `max_connections` |
| Redis memory usage                | Redis       | > 80% of `maxmemory`   |
| MinIO disk usage                  | MinIO       | > 85% capacity         |
| CPU / Memory per container        | cAdvisor    | CPU > 80%, Mem > 90%   |
| TLS certificate expiry            | Certbot     | < 14 days              |

### Grafana Dashboards

Import these community dashboards:

- **Node.js Application** — Dashboard ID `11159`
- **PostgreSQL** — Dashboard ID `9628`
- **Redis** — Dashboard ID `11835`
- **Docker & Host** — Dashboard ID `893`

---

## Log Management

### Viewing Logs

```bash
# All services
docker compose logs --tail=100

# Specific service with follow
docker compose logs -f backend

# Filter by time
docker compose logs --since="2025-01-15T10:00:00" backend
```

### Log Rotation

Docker's default `json-file` log driver doesn't rotate by default. Configure it in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```

Restart Docker after changing:

```bash
service docker restart
```

### Centralized Logging (Optional)

For production, forward logs to a centralized system:

```yaml
services:
  backend:
    logging:
      driver: syslog
      options:
        syslog-address: "tcp://logserver:514"
        tag: "harmoniq-backend"
```

Alternatives: Loki + Grafana, ELK stack, or Fluentd.

---

## Health Checks

Quick commands to verify system health:

```bash
# All containers running
docker compose ps

# Backend API responding
curl -s http://localhost:4000/health | jq .

# Database connectivity
docker compose exec postgres pg_isready -U harmoniq

# Redis connectivity
docker compose exec redis redis-cli ping

# MinIO connectivity
curl -s http://localhost:9000/minio/health/live

# Disk space
df -h /var/lib/docker
```
