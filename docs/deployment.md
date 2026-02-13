# Deployment

This guide covers deploying CLAHub to production. Choose the method that fits your infrastructure.

## Docker (recommended for self-hosting)

Docker is the simplest way to self-host CLAHub. The included `Dockerfile` produces a minimal, multi-stage image based on `node:20-alpine`.

### Quick start

1. **Copy and fill in the environment file:**

   ```bash
   cp .env.docker.example .env
   ```

   Edit `.env` with your values — see the [Configuration Guide](./configuration.md) for details.

2. **Start the container:**

   ```bash
   docker compose up -d
   ```

3. **Verify it's running:**

   ```bash
   curl http://localhost:3000/api/health
   ```

That's it. The entrypoint script automatically runs `prisma db push` on every container start, so the database schema is always up to date.

### How it works

- **Data persistence:** SQLite is stored at `/app/data/clahub.db` inside the container. The `clahub-data` named volume is mounted to `/app/data`, ensuring data survives container restarts and upgrades.
- **Health checks:** Docker Compose includes a built-in health check that polls `/api/health` every 30 seconds.
- **Port:** The container listens on port `3000`. Map it to any host port in `docker-compose.yml`.
- **Restart policy:** `unless-stopped` — the container restarts automatically unless you explicitly stop it.

### Custom branding

Set these optional variables in your `.env` file:

```env
APP_NAME="MyCLA"
APP_LOGO_URL="https://example.com/logo.png"
APP_PRIMARY_COLOR="#0066cc"
```

### Building a custom image

If you've forked CLAHub or need a custom build:

```bash
docker build -t my-clahub .
```

Then reference `my-clahub` instead of the default build in `docker-compose.yml`.

---

## Vercel

CLAHub is a Next.js app, so Vercel auto-detects the framework.

1. **Import the repository** on [vercel.com](https://vercel.com).
2. **Set environment variables** in the Vercel dashboard (see [Configuration Guide](./configuration.md)).
3. **Deploy.** Vercel handles building and hosting automatically.

> **Important:** Vercel uses ephemeral, read-only file systems in production. SQLite databases are not persisted across deployments. This makes Vercel suitable for demos and previews, but not for production use with real data. For persistent data, use Docker or another self-hosted option.

---

## Railway

Railway can deploy directly from a Dockerfile.

1. **Create a new project** and connect your GitHub repository.
2. Railway auto-detects the `Dockerfile` and builds accordingly.
3. **Add a persistent volume** and mount it to `/app/data` so SQLite data persists.
4. **Set environment variables** in the Railway dashboard. Make sure `DATABASE_URL` points to the mounted volume path (e.g. `file:/app/data/clahub.db`).
5. **Deploy:**

   ```bash
   railway up
   ```

---

## Fly.io

1. **Launch the app:**

   ```bash
   fly launch
   ```

   Fly detects the `Dockerfile` automatically.

2. **Create and attach a persistent volume:**

   ```bash
   fly volumes create clahub_data --size 1 --region <your-region>
   ```

   Add the volume mount to your `fly.toml`:

   ```toml
   [mounts]
     source = "clahub_data"
     destination = "/app/data"
   ```

3. **Set secrets:**

   ```bash
   fly secrets set NEXTAUTH_SECRET="..." GITHUB_APP_ID="..." # ... etc
   ```

   Ensure `DATABASE_URL` is set to `file:/app/data/clahub.db`.

4. **Deploy:**

   ```bash
   fly deploy
   ```

---

## Generic Node.js (PM2 / systemd)

For bare-metal or VM deployments without Docker.

### Build

```bash
npm ci
npx prisma generate
npm run build
```

### Database setup

```bash
npx prisma db push
```

### Run with PM2

```bash
pm2 start .next/standalone/server.js --name clahub
pm2 save
```

### Run with systemd

Create `/etc/systemd/system/clahub.service`:

```ini
[Unit]
Description=CLAHub
After=network.target

[Service]
Type=simple
User=clahub
WorkingDirectory=/opt/clahub
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/clahub/.env

[Install]
WantedBy=multi-user.target
```

Then enable and start:

```bash
sudo systemctl enable clahub
sudo systemctl start clahub
```

### Reverse proxy (nginx)

Put CLAHub behind nginx for HTTPS termination:

```nginx
server {
    listen 443 ssl http2;
    server_name cla.example.com;

    ssl_certificate     /etc/letsencrypt/live/cla.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cla.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Next Steps

- [Configuration Guide](./configuration.md) — environment variable reference
- [Upgrading Guide](./upgrading.md) — update to new versions safely
