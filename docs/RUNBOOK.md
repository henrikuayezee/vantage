# Operations Runbook
# Vantage — Project Management Platform
**Audience:** Developers and operators managing a running Vantage instance
**Last Updated:** 2026-05-27

---

## 1. Daily Operations

### Check that all containers are running

```bash
docker compose ps
```

Expected output: all four services (`postgres`, `api`, `web`, `nginx`) showing `running`.

### View recent logs

```bash
# All services
docker compose logs --tail=100

# API only
docker compose logs --tail=100 api

# Follow live logs
docker compose logs -f api
```

### Check API health

```bash
curl https://vantage.yourdomain.com/api/health
# Expected: { "status": "ok" }
```

---

## 2. User Management

All user management requires Admin role access. Use the Vantage UI at `/admin/users` or use the API directly.

### Invite a new user (via API)

```bash
# First, get an access token
TOKEN=$(curl -s -X POST https://vantage.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your-password"}' \
  | jq -r '.accessToken')

# Invite a user
curl -X POST https://vantage.yourdomain.com/api/users/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@yourdomain.com","name":"New User","role":"DEVELOPER"}'
```

Valid roles: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`

### Deactivate a user

```bash
# Get user list to find the user ID
curl -H "Authorization: Bearer $TOKEN" \
  https://vantage.yourdomain.com/api/users

# Deactivate by ID
curl -X PATCH https://vantage.yourdomain.com/api/users/<user-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

Deactivated users cannot log in but their data is retained. Reactivate by setting `isActive: true`.

### Change a user's role

```bash
curl -X PATCH https://vantage.yourdomain.com/api/users/<user-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "PROJECT_MANAGER"}'
```

### Force-logout all sessions for a user

```bash
# Bumps the user's tokenVersion, invalidating all issued refresh tokens
curl -X POST https://vantage.yourdomain.com/api/auth/logout-all \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Database Operations

### Connect to the database

```bash
# Interactive psql session
docker compose exec postgres psql -U vantage -d vantage

# Run a one-off SQL command
docker compose exec postgres psql -U vantage -d vantage -c "SELECT COUNT(*) FROM \"User\";"
```

### Open Prisma Studio (GUI database browser)

```bash
cd /opt/vantage
pnpm --filter @vantage/api db:studio
```

Prisma Studio opens at http://localhost:5555. Use an SSH tunnel if accessing remotely:

```bash
ssh -L 5555:localhost:5555 user@your-server
```

### Run pending migrations

```bash
docker compose exec api node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate
```

Always run this after pulling new code that includes schema changes.

### Check migration status

```bash
docker compose exec api npx prisma migrate status --schema=apps/api/prisma/schema.prisma
```

---

## 4. Seeding

The seed script creates the first Admin account and a sample organization. It is safe to run multiple times — it checks for existing data before inserting.

```bash
# Production seed (compiled)
docker compose exec api node apps/api/dist/prisma/seed.js

# Development seed (TypeScript directly)
pnpm --filter @vantage/api db:seed
```

The seed prints the admin email and temporary password to the console. **Change the password immediately after first login.**

---

## 5. Backups

### Automated daily backup (recommended)

Create `/opt/vantage/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/opt/backups/vantage"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="vantage_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose -f /opt/vantage/docker-compose.yml exec -T postgres \
  pg_dump -U vantage vantage | gzip > "$BACKUP_DIR/$FILENAME"

echo "Backup saved: $BACKUP_DIR/$FILENAME"

# Keep only the last 30 backups
ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +31 | xargs -r rm
```

```bash
chmod +x /opt/vantage/scripts/backup.sh

# Schedule daily at 2am
crontab -e
# Add:
0 2 * * * /opt/vantage/scripts/backup.sh >> /var/log/vantage-backup.log 2>&1
```

### Manual backup

```bash
docker compose exec -T postgres pg_dump -U vantage vantage > backup_$(date +%Y%m%d).sql
```

### Restore from backup

```bash
# Stop the API to prevent writes during restore
docker compose stop api web

# Restore (will drop and recreate all tables)
cat backup_20260527.sql | docker compose exec -T postgres psql -U vantage -d vantage

# Restart
docker compose start api web
```

---

## 6. Restarting Services

```bash
# Restart all services
docker compose restart

# Restart a single service (e.g. after config change)
docker compose restart api

# Full stop and start
docker compose down
docker compose up -d
```

---

## 7. Updating the Application

```bash
cd /opt/vantage

# 1. Pull latest code
git pull origin master

# 2. Rebuild changed images
docker compose build api web

# 3. Apply any new migrations before restarting
docker compose exec api node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate

# 4. Restart with new images
docker compose up -d --no-deps api web
```

---

## 8. SSL Certificate Renewal

Certificates are auto-renewed by the cron job set up during initial deployment. To renew manually:

```bash
docker compose stop nginx
sudo certbot renew
docker compose start nginx
```

Check certificate expiry:

```bash
sudo certbot certificates
```

---

## 9. Troubleshooting

### API container keeps restarting

```bash
docker compose logs api --tail=50
```

Common causes:
- `DATABASE_URL` is wrong → check `.env` and that `postgres` container is running
- `JWT_PRIVATE_KEY` is malformed → verify the PEM format and `\n` escaping
- Port conflict → check `PORT` env var

### Cannot log in

1. Confirm the API is running: `curl https://vantage.yourdomain.com/api/health`
2. Confirm `FRONTEND_URL` in `apps/api/.env` matches the actual web URL (for CORS)
3. Check login endpoint directly: `curl -X POST https://vantage.yourdomain.com/api/auth/login -d '{"email":"...","password":"..."}' -H "Content-Type: application/json"`

### Invitation emails not sending

- Confirm `RESEND_API_KEY` is set and valid (test at resend.com/dashboard)
- Confirm `EMAIL_FROM` domain is verified in Resend
- Check API logs for `EmailService` errors: `docker compose logs api | grep -i email`

### Database is full or slow

```bash
# Check database size
docker compose exec postgres psql -U vantage -d vantage -c "\l+"

# Vacuum the database (reclaim dead row storage)
docker compose exec postgres psql -U vantage -d vantage -c "VACUUM ANALYZE;"
```

### Disk space running low

```bash
# Check disk usage
df -h

# Check Docker image/container/volume size
docker system df

# Remove unused Docker resources (safe — only removes unused images/volumes)
docker system prune -f
```

---

## 10. Monitoring (Optional)

For production deployments with uptime requirements, consider:

- **Uptime monitoring:** [UptimeRobot](https://uptimerobot.com) (free) — monitor `GET /api/health` every 5 minutes
- **Log aggregation:** Forward Docker logs to Papertrail or Logtail via a logging driver
- **Error tracking:** Add Sentry SDK to the NestJS app for exception alerting
- **Metrics:** Prometheus + Grafana stack if detailed performance metrics are needed
