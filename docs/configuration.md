# Configuration

This guide covers every environment variable CLAHub uses and walks through creating the required GitHub App and OAuth Apps.

## Environment Variables

### Core

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./clahub.db` | SQLite database path. Use `file:/app/data/clahub.db` in Docker. |
| `NEXTAUTH_SECRET` | Yes | — | Secret used to encrypt sessions. Generate with `openssl rand -base64 32`. |
| `APP_URL` | Yes | `http://localhost:3000` | Public URL of your CLAHub instance (no trailing slash). |

### GitHub App

| Variable | Required | Description |
|---|---|---|
| `GITHUB_APP_ID` | Yes | Numeric ID of your GitHub App. |
| `GITHUB_APP_PRIVATE_KEY` | Yes | PEM-encoded private key for your GitHub App. |
| `GITHUB_WEBHOOK_SECRET` | Yes | Webhook secret configured on your GitHub App. |

### GitHub OAuth — Owner

Used when repository owners sign in. Requires elevated scopes to manage webhooks and read org membership.

| Variable | Required | Description |
|---|---|---|
| `GITHUB_OWNER_CLIENT_ID` | Yes | Client ID of the Owner OAuth App. |
| `GITHUB_OWNER_CLIENT_SECRET` | Yes | Client secret of the Owner OAuth App. |

**Scopes:** `user:email repo:status admin:repo_hook read:org`

### GitHub OAuth — Contributor

Used when contributors sign in to accept a CLA. Uses default (minimal) scopes.

| Variable | Required | Description |
|---|---|---|
| `GITHUB_CONTRIBUTOR_CLIENT_ID` | Yes | Client ID of the Contributor OAuth App. |
| `GITHUB_CONTRIBUTOR_CLIENT_SECRET` | Yes | Client secret of the Contributor OAuth App. |

### Branding (optional)

Customize the look of your CLAHub instance.

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `CLAHub` | Application name shown in the header and page titles. |
| `APP_LOGO_URL` | — | URL to a custom logo image. |
| `APP_PRIMARY_COLOR` | — | Primary brand color as a hex value (e.g. `#0066cc`). |

### Email (optional)

| Variable | Default | Description |
|---|---|---|
| `RESEND_API_KEY` | — | API key for Resend email service. |
| `EMAIL_FROM` | `noreply@cla-hub.io` | Sender address for outgoing emails. |

### Monitoring (optional)

| Variable | Description |
|---|---|
| `SENTRY_DSN` | Server-side Sentry DSN for error tracking. |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side Sentry DSN (exposed to the browser). |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`). |

---

## GitHub Setup Walkthrough

CLAHub requires three GitHub resources: a **GitHub App** (for webhooks and check runs) and two **OAuth Apps** (for owner and contributor sign-in).

### Step 1: Create a GitHub App

1. Go to **Settings > Developer settings > GitHub Apps > New GitHub App**.
2. Fill in the basics:
   - **App name:** e.g. `CLAHub` or `MyCLA`
   - **Homepage URL:** your `APP_URL`
   - **Webhook URL:** `{APP_URL}/api/webhooks/github`
   - **Webhook secret:** generate one (`openssl rand -hex 20`) and save it as `GITHUB_WEBHOOK_SECRET`
3. Set **permissions**:
   - **Checks:** Read & write
   - **Pull requests:** Read-only
   - **Contents:** Read-only
   - **Members:** Read-only
4. Subscribe to **events**:
   - `installation`
   - `installation_repositories`
   - `pull_request`
   - `push`
   - `repository`
5. Set **Where can this GitHub App be installed?** to "Any account" (or "Only on this account" for private use).
6. Click **Create GitHub App**.
7. Note the **App ID** — save it as `GITHUB_APP_ID`.
8. Under **Private keys**, click **Generate a private key**. Save the downloaded `.pem` file contents as `GITHUB_APP_PRIVATE_KEY`.

> **Tip:** For multi-line PEM keys in `.env` files, replace newlines with `\n` so the value stays on one line, or use your platform's secret management to inject the full key.

### Step 2: Create the Owner OAuth App

1. Go to **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Fill in:
   - **Application name:** e.g. `CLAHub Owner`
   - **Homepage URL:** your `APP_URL`
   - **Authorization callback URL:** `{APP_URL}/api/auth/callback/github-owner`
3. Click **Register application**.
4. Save the **Client ID** as `GITHUB_OWNER_CLIENT_ID`.
5. Generate a **Client secret** and save it as `GITHUB_OWNER_CLIENT_SECRET`.

### Step 3: Create the Contributor OAuth App

1. Go to **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Fill in:
   - **Application name:** e.g. `CLAHub Contributor`
   - **Homepage URL:** your `APP_URL`
   - **Authorization callback URL:** `{APP_URL}/api/auth/callback/github-contributor`
3. Click **Register application**.
4. Save the **Client ID** as `GITHUB_CONTRIBUTOR_CLIENT_ID`.
5. Generate a **Client secret** and save it as `GITHUB_CONTRIBUTOR_CLIENT_SECRET`.

### Step 4: Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output into your `.env.local` (or `.env` for Docker) as `NEXTAUTH_SECRET`.

---

## Next Steps

- [Getting Started](./getting-started.md) — local development setup
- [Deployment Guide](./deployment.md) — deploy to production
