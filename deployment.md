# Deployment Guide

This guide explains how to deploy Tea For Two using Cloudflare Tunnel. No port forwarding required.

## Overview

The deployment uses Docker to run two services:

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │  Cloudflare  │                         │
│                    │   (HTTPS)    │                         │
│                    └──────────────┘                         │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │ Tunnel (outbound connection)
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    Your Server                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Docker Compose                      │   │
│  │                                                      │   │
│  │         ┌──────────┐         ┌──────────┐           │   │
│  │         │  Tunnel  │────────▶│   App    │           │   │
│  │         │(cloudflared)       │ (nginx)  │           │   │
│  │         └──────────┘         └──────────┘           │   │
│  │              │                                       │   │
│  │              │ Outbound connection                   │   │
│  │              │ (no open ports needed)                │   │
│  └──────────────┼───────────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  ▼
            Cloudflare Edge
```

### What each service does

| Service | Image | Purpose |
|---------|-------|---------|
| **app** | Custom (nginx) | Serves the built game files |
| **tunnel** | cloudflare/cloudflared | Creates secure tunnel to Cloudflare |

### Why Cloudflare Tunnel?

- **No port forwarding** - The tunnel creates an outbound connection, so you don't need to configure your router
- **No firewall rules** - Works behind NAT, firewalls, even restrictive networks
- **Automatic HTTPS** - Cloudflare handles SSL certificates at their edge
- **DDoS protection** - Traffic goes through Cloudflare's network

---

## Prerequisites

### On your server

1. **Docker** - Install Docker Engine:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect
   ```

2. **Docker Compose** - Usually included with Docker, verify with:
   ```bash
   docker compose version
   ```

### On Cloudflare

You need a Cloudflare account with your domain added.

#### Step 1: Add your domain to Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter your domain (e.g., `tea-for-two.co.uk`)
4. Select the Free plan
5. Cloudflare will scan your existing DNS records
6. Update your domain registrar's nameservers to the ones Cloudflare provides
   - This is done at wherever you bought the domain (e.g., Namecheap, GoDaddy)
   - It can take up to 24 hours to propagate

#### Step 2: Create a tunnel

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com)
2. Select your account (you may need to set up Zero Trust on first visit - the free plan is fine)
3. Go to **Networks** > **Tunnels**
4. Click **Create a tunnel**
5. Select **Cloudflared** as the connector type
6. Name it something like `tea-for-two`
7. Click **Save tunnel**
8. **Copy the tunnel token** - it's a long string starting with `eyJ...`

#### Step 3: Configure the public hostname

Still in the tunnel setup:

1. Click on the **Public Hostname** tab
2. Click **Add a public hostname**
3. Fill in:
   - **Subdomain**: leave empty for root domain, or enter `www`
   - **Domain**: select `tea-for-two.co.uk`
   - **Path**: leave empty
   - **Type**: HTTP
   - **URL**: `app:80`
4. Click **Save hostname**
5. Repeat for `www` subdomain if desired

---

## Deployment Steps

### 1. Clone the repository to your server

```bash
git clone <your-repo-url> tea-for-two
cd tea-for-two
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` and add your tunnel token:
```
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWJjZGVmZzEyMzQ1Njc4OTAiLCJ0IjoiYWJjZGVmZy0xMjM0LTU2NzgtOTBhYi1jZGVmMDEyMzQ1NjciLCJzIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIn0=
```

### 3. Build and start the services

```bash
docker compose up -d --build
```

This will:
- Build the app image (compiles TypeScript, bundles with Vite)
- Start the app and tunnel containers
- The tunnel connects to Cloudflare automatically

### 4. Verify everything is running

```bash
docker compose ps
```

You should see both services as "Up":
```
NAME                    STATUS
tea-for-two-app-1       Up
tea-for-two-tunnel-1    Up
```

Check tunnel logs to confirm connection:
```bash
docker compose logs tunnel
```

You should see something like:
```
INF Registered tunnel connection connIndex=0 ...
```

### 5. Test your site

Visit `https://tea-for-two.co.uk` - it should be live with HTTPS.

---

## File Reference

### docker-compose.yml

```yaml
services:
  app:
    build: .                    # Build from Dockerfile
    restart: unless-stopped

  tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}  # From .env file
    depends_on:
      - app
```

### Dockerfile

Two-stage build for a small, efficient image:

```dockerfile
# Stage 1: Build the app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                      # Install dependencies
COPY . .
RUN npm run build               # TypeScript check + Vite build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs for all services
docker compose logs

# View logs for a specific service
docker compose logs tunnel
docker compose logs app

# Follow logs in real-time
docker compose logs -f

# Rebuild after code changes
docker compose up -d --build

# Restart a specific service
docker compose restart tunnel

# Check service status
docker compose ps
```

---

## Troubleshooting

### Tunnel won't connect

Check the logs:
```bash
docker compose logs tunnel
```

**"Invalid tunnel token"** - The token in your `.env` file is wrong or expired. Generate a new one in the Cloudflare dashboard.

**"failed to connect"** - Usually a temporary network issue. The tunnel will retry automatically.

### Site shows Cloudflare error page

1. **Check the tunnel is connected:**
   ```bash
   docker compose logs tunnel | grep -i registered
   ```

2. **Check the app is running:**
   ```bash
   docker compose logs app
   ```

3. **Verify public hostname config** - In Cloudflare Zero Trust dashboard, check that the URL is set to `app:80` (not `localhost:80`).

### Changes not appearing after deploy

Make sure to rebuild:
```bash
docker compose up -d --build
```

### 502 Bad Gateway

The tunnel can't reach the app container. Check:
1. App container is running: `docker compose ps`
2. App logs for errors: `docker compose logs app`
3. Public hostname URL is `app:80` in Cloudflare dashboard

---

## Updating the Site

When you've made changes to the code:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build
```

The `--build` flag tells Docker to rebuild the app image with your new code.

---

## Security Notes

- **Keep your tunnel token secret** - It grants access to route traffic to your server. Never commit `.env` to git.
- **The app container is not exposed** - Only the tunnel can reach it, and only Cloudflare can use the tunnel.
- **Enable Cloudflare security features** - In the Cloudflare dashboard, you can enable bot protection, rate limiting, and WAF rules.
