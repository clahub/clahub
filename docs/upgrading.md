# Upgrading

This guide covers updating CLAHub to a new version.

## Before You Upgrade

### Back up your database

SQLite is a single file. Copy it before upgrading:

```bash
cp data/clahub.db data/clahub.db.bak
```

For Docker deployments, the database lives inside the `clahub-data` volume:

```bash
docker compose exec clahub cp /app/data/clahub.db /app/data/clahub.db.bak
```

### Continuous backups with Litestream

For production deployments, consider [Litestream](https://litestream.io/) for continuous SQLite replication to S3, GCS, or Azure Blob Storage. Litestream streams WAL changes in near real-time, giving you point-in-time recovery without scheduled backup scripts.

---

## Docker

Pull the latest image and recreate the container:

```bash
docker compose pull
docker compose up -d
```

The entrypoint script runs `prisma db push --skip-generate` on every container start, so schema changes are applied automatically. No manual migration step is needed.

If you build from source:

```bash
docker compose build
docker compose up -d
```

---

## Node.js (PM2 / systemd)

1. **Pull the latest code:**

   ```bash
   git pull origin main
   ```

2. **Install dependencies and rebuild:**

   ```bash
   npm ci
   npx prisma generate
   npm run build
   ```

3. **Apply database changes:**

   ```bash
   npx prisma db push
   ```

   This command is idempotent — it compares the Prisma schema against the existing database and applies only what's needed. Safe to run on every upgrade.

4. **Restart the application:**

   ```bash
   # PM2
   pm2 restart clahub

   # systemd
   sudo systemctl restart clahub
   ```

---

## Vercel

Vercel deploys automatically when you push to your connected branch. No manual steps are needed. If your Prisma schema changed, the build process generates the updated client automatically.

> **Reminder:** Vercel uses an ephemeral filesystem — SQLite data does not persist across deployments.

---

## Railway / Fly.io

Both platforms rebuild from the Dockerfile on push. The entrypoint handles database migrations automatically, same as Docker.

```bash
# Railway
railway up

# Fly.io
fly deploy
```

---

## Troubleshooting

### Migration fails on startup

If `prisma db push` fails (e.g. due to a breaking schema change), restore your backup and check the release notes:

```bash
# Restore backup
cp data/clahub.db.bak data/clahub.db
```

### Application won't start after upgrade

1. Ensure you ran `npm ci` (not `npm install`) to get exact dependency versions.
2. Ensure `npx prisma generate` ran successfully before `npm run build`.
3. Check logs for missing environment variables — new versions may introduce new required variables.
