# Deployment Guide
# Vantage — Project Management Platform
**Audience:** DevOps / developers deploying Vantage to a cloud server
**Last Updated:** 2026-05-27

---

## 1. Overview

Vantage ships as a Docker Compose application. The production stack consists of four containers:

| Container | Image | Port |
|---|---|---|
| `postgres` | postgres:16-alpine | 5432 (internal) |
| `api` | Built from `apps/api/Dockerfile` | 3001 (internal) |
| `web` | Built from `apps/web/Dockerfile` | 3000 (internal) |
| `nginx` | nginx:alpine | 80, 443 (public) |

Nginx is the only container exposed to the internet. It terminates SSL and routes traffic to the api and web containers.

---

## 2. Server Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

Supported cloud providers: **DigitalOcean Droplet**, **AWS EC2 (t3.small+)**, **Hetzner Cloud CX21**, any Linux VPS with Docker support.

---

## 3. Server Setup (one-time)

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker Engine
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker is running
docker --version
docker compose version

# Install Certbot (for SSL)
sudo apt install -y certbot
```

---

## 4. Deploying Vantage

### 4.1 Clone the repository

```bash
git clone https://github.com/henrikuayezee/vantage.git /opt/vantage
cd /opt/vantage
```

### 4.2 Configure environment variables

```bash
# Backend
cp apps/api/.env.example apps/api/.env
nano apps/api/.env   # fill in all values (see Section 6)

# Frontend
cp apps/web/.env.example apps/web/.env.local
nano apps/web/.env.local   # set API_URL to your domain's internal URL
```

For `API_URL` in `apps/web/.env.local`, use the internal Docker network name:
```
API_URL=http://api:3001
```

### 4.3 Build and start the containers

```bash
# Build all images (takes 5–10 minutes on first run)
docker compose build

# Start all services in the background
docker compose up -d

# Verify all containers are running
docker compose ps
```

### 4.4 Run database migrations

```bash
docker compose exec api node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate
```

### 4.5 Seed the first admin account

```bash
docker compose exec api node apps/api/dist/prisma/seed.js
```

The admin email and temporary password are printed to the console. Log in and change the password immediately.

---

## 5. SSL with Let's Encrypt (Certbot)

### 5.1 Point your domain to the server

Create an A record in your DNS provider:
```
A    vantage.yourdomain.com → <server-ip>
```
Wait for DNS propagation (up to 30 minutes).

### 5.2 Obtain a certificate

```bash
# Stop nginx temporarily to free port 80
docker compose stop nginx

# Obtain certificate (replace with your domain)
sudo certbot certonly --standalone -d vantage.yourdomain.com

# Certificates are saved at:
# /etc/letsencrypt/live/vantage.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/vantage.yourdomain.com/privkey.pem
```

### 5.3 Update nginx.conf for SSL

Edit `nginx/nginx.conf` and update the server block:

```nginx
server {
    listen 80;
    server_name vantage.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vantage.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/vantage.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vantage.yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # API proxy
    location /api/ {
        proxy_pass         http://api:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass         http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Mount the certificate directory in `docker-compose.yml` by adding to the `nginx` service:

```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 5.4 Restart nginx

```bash
docker compose start nginx
```

### 5.5 Auto-renew certificates

Certbot certificates expire every 90 days. Set up a cron job:

```bash
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker compose -f /opt/vantage/docker-compose.yml restart nginx
```

---

## 6. Required Environment Variables (Production Checklist)

### `apps/api/.env`

```env
DATABASE_URL="postgresql://vantage:<strong-password>@postgres:5432/vantage?schema=public"

JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<your-key>\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n<your-key>\n-----END PUBLIC KEY-----"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3001
NODE_ENV=production
FRONTEND_URL="https://vantage.yourdomain.com"

RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="Vantage <noreply@yourdomain.com>"
```

**Generating RSA keys:**
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Copy file contents into the env vars, replacing newlines with \n
```

### `apps/web/.env.local`

```env
API_URL=http://api:3001
```

### `docker-compose.yml` — postgres password

Update the `POSTGRES_PASSWORD` in `docker-compose.yml` to match the password in `DATABASE_URL`:
```yaml
environment:
  POSTGRES_PASSWORD: <strong-password>
```

---

## 7. Deploying Updates (Continuous Deployment)

When new code is pushed to GitHub, deploy updates with:

```bash
cd /opt/vantage

# Pull latest code
git pull origin master

# Rebuild changed images
docker compose build api web

# Restart with zero-downtime (rolling restart)
docker compose up -d --no-deps api web

# Run any new migrations
docker compose exec api node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate
```

### Automating with GitHub Actions

The CI pipeline at `.github/workflows/ci.yml` runs lint + typecheck + build on every push. To add auto-deploy on push to `master`, extend the workflow:

```yaml
deploy:
  needs: [lint-and-typecheck, build]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/master'
  steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/vantage
          git pull origin master
          docker compose build api web
          docker compose up -d --no-deps api web
          docker compose exec -T api node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate
```

Add `SERVER_HOST`, `SERVER_USER`, and `SERVER_SSH_KEY` to your GitHub repository secrets.

---

## 8. Cloud Hosting Options

| Provider | Tier | Estimated Cost | Notes |
|---|---|---|---|
| DigitalOcean | Basic Droplet 2GB | ~$18/month | Simplest setup; 1-click Docker image available |
| Hetzner Cloud | CX21 (2 vCPU, 4 GB) | ~$6/month | Best price/performance for EU |
| AWS EC2 | t3.small | ~$15/month | Most ecosystem flexibility; use Elastic IP |
| AWS Lightsail | $10 plan | $10/month | Simplified EC2; includes static IP + 3 TB transfer |

All providers support Docker Compose + Certbot. The deployment steps in Section 4 are identical across all of them.
