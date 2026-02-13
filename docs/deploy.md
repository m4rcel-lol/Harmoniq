# Harmoniq Deployment Guide

Step-by-step instructions for deploying Harmoniq on an Alpine Linux server using Docker.

---

## Prerequisites

| Requirement    | Minimum Version |
|----------------|-----------------|
| Docker         | 24.0+           |
| docker compose | 2.20+           |
| Git            | 2.40+           |
| OpenSSL        | 3.0+            |
| RAM            | 2 GB            |
| Disk           | 20 GB           |

Install Docker on Alpine Linux:

```bash
apk update && apk add docker docker-compose git openssl curl
rc-update add docker boot
service docker start
```

---

## 1. Clone & Configure

```bash
git clone https://github.com/your-org/Harmoniq.git
cd Harmoniq

# Create environment file from template
cp .env.example .env
```

Edit `.env` and set **all** production secrets:

```bash
# Generate strong secrets
openssl rand -base64 48   # use for JWT_SECRET
openssl rand -base64 48   # use for JWT_REFRESH_SECRET
openssl rand -base64 32   # use for MINIO_SECRET_KEY
openssl rand -base64 32   # use for COTURN_SECRET
```

Update these values in `.env`:

```
DB_PASSWORD=<strong-database-password>
JWT_SECRET=<generated-jwt-secret>
JWT_REFRESH_SECRET=<generated-refresh-secret>
MINIO_SECRET_KEY=<generated-minio-secret>
COTURN_SECRET=<generated-coturn-secret>
CORS_ORIGIN=https://your-domain.com
DOMAIN=your-domain.com
EMAIL=admin@your-domain.com
```

---

## 2. Build & Start

```bash
# Build all images and start services in detached mode
docker compose -f docker-compose.yml up -d --build

# Verify all containers are running
docker compose ps

# View backend logs
docker compose logs -f backend
```

Expected containers:

| Container   | Port(s)               | Purpose                  |
|-------------|------------------------|--------------------------|
| nginx       | 80, 443               | Reverse proxy & TLS      |
| backend     | 4000 (internal)       | API & WebSocket server   |
| postgres    | 5432 (internal)       | Database                 |
| redis       | 6379 (internal)       | Cache & pub/sub          |
| minio       | 9000, 9001            | Object storage           |
| coturn      | 3478, 5349, 49152-200 | TURN/STUN for WebRTC     |

---

## 3. TLS Setup with Certbot

### 3a. Initial Certificate

```bash
# Start with the TLS profile to launch certbot
docker compose --profile tls up -d certbot

# Request the initial certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com \
  -d www.your-domain.com \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email
```

### 3b. Enable HTTPS in nginx

Update `infra/nginx/conf.d/default.conf` to reference the certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... proxy rules ...
}
```

Reload nginx:

```bash
docker compose exec nginx nginx -s reload
```

### 3c. Auto-Renewal

The certbot container automatically attempts renewal every 12 hours. To manually test:

```bash
docker compose run --rm certbot renew --dry-run
```

---

## 4. Database Initialization

The PostgreSQL container auto-runs `infra/db/init.sql` on first start via the `docker-entrypoint-initdb.d` mount. To manually re-initialize or run migrations:

```bash
# Connect to the database
docker compose exec postgres psql -U harmoniq -d harmoniq

# Or run the init script manually
docker compose exec -T postgres \
  psql -h db -U harmoniq -d harmoniq < ./infra/db/init.sql
```

---

## 5. Backups

### 5a. PostgreSQL Backup

```bash
# Dump the database
docker compose exec -T postgres \
  pg_dump -U harmoniq -d harmoniq --format=custom \
  > backup_$(date +%Y%m%d_%H%M%S).dump

# Restore from a dump
docker compose exec -T postgres \
  pg_restore -U harmoniq -d harmoniq --clean < backup_20250115_120000.dump
```

### 5b. MinIO Backup

```bash
# Install mc (MinIO Client) if not already available
docker run --rm -v minio-backup:/backup --network harmoniq_harmoniq \
  minio/mc alias set local http://minio:9000 harmoniq harmoniq_secret

# Mirror the bucket to a local directory
docker run --rm -v $(pwd)/minio-backup:/backup --network harmoniq_harmoniq \
  minio/mc mirror local/harmoniq-uploads /backup/
```

### 5c. Automated Backups (cron)

Add to the host's crontab:

```bash
# Daily database backup at 2 AM
0 2 * * * cd /opt/harmoniq && docker compose exec -T postgres pg_dump -U harmoniq -d harmoniq --format=custom > /opt/backups/db_$(date +\%Y\%m\%d).dump

# Weekly MinIO backup on Sunday at 3 AM
0 3 * * 0 cd /opt/harmoniq && docker run --rm -v /opt/backups/minio:/backup --network harmoniq_harmoniq minio/mc mirror local/harmoniq-uploads /backup/
```

---

## 6. Stopping & Restarting

```bash
# Stop all services
docker compose down

# Stop and remove volumes (DESTROYS DATA)
docker compose down -v

# Restart a single service
docker compose restart backend

# Rebuild and restart a single service
docker compose up -d --build backend
```

---

## 7. Updating

```bash
git pull origin main

# Rebuild and restart with zero downtime
docker compose up -d --build

# Run any new database migrations
docker compose exec -T postgres \
  psql -U harmoniq -d harmoniq < ./infra/db/migrations/latest.sql
```

---

## Troubleshooting

| Symptom                        | Fix                                                        |
|--------------------------------|------------------------------------------------------------|
| Container keeps restarting     | `docker compose logs <service>` — check for config errors  |
| Port already in use            | `ss -tlnp \| grep <port>` — stop conflicting process      |
| Database connection refused    | Wait for healthcheck: `docker compose ps` shows "healthy"  |
| Certificate renewal fails      | Ensure port 80 is open and DNS points to server            |
| WebSocket connection drops     | Check nginx proxy_read_timeout and upgrade headers         |
