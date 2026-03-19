# CLAHub User Guide

A complete guide to using CLAHub for managing Contributor License Agreements on GitHub.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [For Project Owners](#for-project-owners)
   - [Creating an Agreement](#creating-an-agreement)
   - [CLA Templates](#cla-templates)
   - [Custom Form Fields](#custom-form-fields)
   - [Organization-Wide CLAs](#organization-wide-clas)
   - [Corporate CLAs (CCLA)](#corporate-clas-ccla)
   - [Managing Exclusions](#managing-exclusions)
   - [Viewing Signatures](#viewing-signatures)
   - [Manual Signature Entry](#manual-signature-entry)
   - [CSV Import](#csv-import)
   - [Revoking Signatures](#revoking-signatures)
   - [Ownership Transfer](#ownership-transfer)
   - [Email Notifications](#email-notifications)
   - [CLA Versioning](#cla-versioning)
   - [CONTRIBUTING.md Generation](#contributingmd-generation)
   - [Audit Log](#audit-log)
   - [README Badges](#readme-badges)
   - [Exporting Data](#exporting-data)
4. [For Contributors](#for-contributors)
   - [Signing a CLA](#signing-a-cla)
   - [What Happens After Signing](#what-happens-after-signing)
5. [REST API](#rest-api)
   - [Authentication](#authentication)
   - [Endpoints](#endpoints)
6. [Self-Hosting](#self-hosting)
7. [Custom Branding](#custom-branding)
8. [Troubleshooting](#troubleshooting)

---

## Overview

CLAHub automates Contributor License Agreement management for GitHub projects. The flow is:

1. **Owner** creates a CLA agreement for a repo or organization
2. A **contributor** opens a pull request
3. CLAHub checks if all commit authors have signed the CLA
4. If not, the PR gets a ❌ "CLA not signed" check — with a link to sign
5. The contributor signs in with GitHub, reads the CLA, and clicks "I agree"
6. CLAHub automatically re-checks the PR → ✅ green checkmark

No PDFs. No emails. No manual tracking.

---

## Getting Started

### Roles

CLAHub has two user roles:

| Role | How to Sign In | What They Can Do |
|------|---------------|-----------------|
| **Owner** | "Sign in as Owner" | Create/edit agreements, view signatures, manage exclusions, transfer ownership, access API |
| **Contributor** | "Sign in as Contributor" | View and sign CLAs |

Owners sign in with elevated GitHub permissions (repo access, org read). Contributors sign in with minimal permissions (public profile only).

### First-Time Setup

1. Go to [cla-hub.io](https://cla-hub.io)
2. Click **"Sign in as Owner"**
3. Authorize CLAHub with GitHub
4. Install the CLAHub GitHub App on your account or organization
5. Create your first agreement

---

## For Project Owners

### Creating an Agreement

1. Click **"New Agreement"** from the dashboard
2. Select the scope:
   - **Repository** — covers a single repo
   - **Organization** — covers all repos in an org
3. Select the repository or organization from the dropdown
4. Choose a CLA template or write custom text in Markdown
5. Optionally add custom form fields
6. Click **"Create Agreement"**

CLAHub will start checking PRs on that repo immediately.

### CLA Templates

Three built-in templates:

| Template | Description |
|----------|-------------|
| **Apache Individual CLA (ICLA)** | Standard Apache-style individual contributor agreement covering copyright and patent grants |
| **Developer Certificate of Origin (DCO)** | Linux Foundation DCO v1.1 — certifies the contributor has the right to submit the code |
| **Custom (Blank)** | Start from scratch with your own Markdown text |

Templates are starting points — edit the text however you like after selecting one.

### Custom Form Fields

Add fields that contributors must fill out when signing. Supported field types:

| Type | Description |
|------|-------------|
| **Text** | Single-line text input |
| **Email** | Email address with validation |
| **URL** | URL with validation |
| **Checkbox** | Boolean agreement (e.g., "I confirm I am authorized...") |
| **Date** | Date picker |

Each field can be marked as **required** or optional, and includes an optional description shown to the contributor.

### Organization-Wide CLAs

Instead of creating a CLA per repo, create one agreement that covers your entire GitHub organization:

1. When creating a new agreement, select **"Organization"** scope
2. Choose the GitHub organization
3. The CLA will apply to PRs across **all repos** in that org

Contributors only need to sign once — the signature covers every repo in the organization.

### Corporate CLAs (CCLA)

For companies whose employees contribute to your project:

1. A company representative signs the CLA as a **Corporate** signature
2. They provide their company name and email domain (e.g., `example.com`)
3. Any contributor whose GitHub email matches that domain is automatically covered

This means individual employees don't need to sign separately — the corporate signature covers everyone with a matching email.

### Managing Exclusions

Not everyone needs to sign a CLA. Exclude:

| Exclusion Type | What It Does |
|---------------|-------------|
| **Auto-detect bots** | Automatically excludes GitHub accounts ending in `[bot]` (Dependabot, Renovate, etc.) |
| **Individual user** | Exclude a specific GitHub username (e.g., core team members) |
| **GitHub team** | Exclude all members of a GitHub team (e.g., `@org/core-team`) |

Excluded users don't need to sign — their commits are bypassed during CLA checks.

To manage exclusions, go to your agreement's edit page and use the Exclusions section.

### Viewing Signatures

From your agreement page, you'll see:

- Total number of signatures
- List of all signatories with their GitHub username, sign date, and signature type (individual/corporate)
- Custom field values for each signature
- Signature source (online, manual, CSV import)

### Manual Signature Entry

For contributors who signed a CLA outside of CLAHub (e.g., via email or paper):

1. Go to your agreement's edit page
2. In the Signature Manager section, enter the GitHub username or email
3. Click **"Add Signature"**

The contributor will be marked as signed without needing to go through the online flow.

### CSV Import

Bulk-import signatures from a CSV file:

1. Prepare a CSV with columns: `github_username` (or `email`)
2. Go to your agreement's edit page
3. Upload the CSV in the Import section
4. Preview the import — CLAHub shows which users will be added, which are duplicates, and any validation errors
5. Confirm the import

### Revoking Signatures

If a signature needs to be invalidated:

1. Go to your agreement's signatories list
2. Click the revoke button next to the signature
3. Confirm the revocation

Revoked signatures can be restored. When a signature is revoked, CLAHub automatically re-checks open PRs — any PR from that contributor will switch from ✅ to ❌.

### Ownership Transfer

Transfer an agreement to another registered CLAHub owner:

1. Go to your agreement's edit page
2. In the Transfer Ownership section, enter the new owner's GitHub username
3. Confirm the transfer

The new owner must already have a CLAHub account (signed in as Owner at least once). The transfer is transactional — all data (signatures, exclusions, versions) moves with the agreement.

### Email Notifications

Get notified when someone signs your CLA:

1. Go to your agreement's edit page
2. Toggle **"Notify on new signatures"**
3. Notifications are sent to the email associated with your GitHub account

Powered by Resend. Notifications include the signer's GitHub username and which agreement they signed.

### CLA Versioning

When you update your CLA text:

1. Edit the agreement text
2. Optionally add a changelog entry explaining what changed
3. Save — this creates a new version

Previous signatures are linked to the version they signed. The version history is preserved in the audit log.

### CONTRIBUTING.md Generation

CLAHub can generate a CONTRIBUTING.md snippet for your repo:

1. Go to your agreement's edit page
2. Find the CONTRIBUTING.md section
3. Copy the generated Markdown

The snippet includes instructions for contributors on how to sign the CLA, plus a badge showing the CLA status.

### Audit Log

Every action in CLAHub is logged:

- Agreement created, updated, deleted
- Signatures signed, revoked, restored
- Exclusions added, removed
- Ownership transfers
- Manual signature entries
- CSV imports

View the audit log from your agreement's edit page. Each entry shows who performed the action, when, and the before/after state.

### README Badges

Add a CLA status badge to your README:

**For a repo agreement:**
```markdown
[![CLA](https://cla-hub.io/api/badge/OWNER/REPO)](https://cla-hub.io/agreements/OWNER/REPO)
```

**For an org-wide agreement:**
```markdown
[![CLA](https://cla-hub.io/api/badge/OWNER)](https://cla-hub.io/agreements/OWNER)
```

The badge shows "CLA: signed" (green) or "CLA: not signed" (red) based on the current PR's status.

### Exporting Data

**CSV Export:**
Download all signatures as a CSV file with columns for GitHub username, email, sign date, signature type, and custom field values.

**PDF Export:**
Generate a PDF document of your CLA agreement text.

Both exports are available from the agreement page and via the REST API.

---

## For Contributors

### Signing a CLA

1. Open a pull request on a project that uses CLAHub
2. You'll see a ❌ "CLAHub" check on your PR
3. Click **"Details"** on the check — this takes you to CLAHub
4. Click **"Sign in as Contributor"** (minimal GitHub permissions)
5. Read the CLA text
6. Fill in any required fields
7. Click **"I agree and sign"**

That's it. You'll be redirected back, and your PR will update to ✅ within seconds.

### What Happens After Signing

- Your signature is recorded permanently
- All **open PRs** on that repo (or org) are automatically re-checked
- You don't need to re-sign for future PRs on the same project
- If the CLA is updated to a new version, you may be asked to re-sign (if the project owner enables re-sign on version bump)

---

## REST API

CLAHub provides a full REST API for programmatic access.

### Authentication

Generate an API key from **Settings → API Keys** in the CLAHub dashboard.

All API requests use Bearer token authentication:

```bash
curl -H "Authorization: Bearer clahub_xxxx" https://cla-hub.io/api/v1/...
```

API keys are prefixed with `clahub_` for easy identification.

### Rate Limits

| Tier | Limit |
|------|-------|
| Authenticated (read) | 100 requests/minute |
| Authenticated (write) | 60 requests/minute |
| Unauthenticated | 30 requests/minute |

Rate limit headers are included in every response:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Endpoints

#### Agreements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agreements` | List your agreements |
| `GET` | `/api/v1/agreements/{owner}/{repo}` | Get a repo agreement |
| `GET` | `/api/v1/agreements/{owner}` | Get an org-wide agreement |

#### Signatures

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agreements/{owner}/{repo}/signatures` | List signatures for a repo agreement |
| `GET` | `/api/v1/agreements/{owner}/signatures` | List signatures for an org agreement |
| `POST` | `/api/v1/agreements/{owner}/{repo}/signatures` | Add a manual signature |

#### Check Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agreements/{owner}/{repo}/check/{username}` | Check if a user has signed (repo) |
| `GET` | `/api/v1/agreements/{owner}/check/{username}` | Check if a user has signed (org) |

#### Exports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agreements/{owner}/{repo}/export/csv` | Export signatures as CSV |
| `GET` | `/api/v1/agreements/{owner}/{repo}/export/pdf` | Export agreement as PDF |

#### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (no auth required) |

---

## Self-Hosting

CLAHub can be self-hosted using Docker:

```bash
git clone https://github.com/DamageLabs/clahub.git
cd clahub
cp .env.docker.example .env
# Edit .env with your GitHub App credentials
docker compose up -d
```

### Requirements

- Docker and Docker Compose
- A GitHub App (for PR checks and webhooks)
- Two GitHub OAuth Apps (owner and contributor)

### What's Included

- Next.js application
- SQLite database (persisted in a Docker volume)
- Auto-migration on startup
- Health check endpoint for container monitoring

### Database

CLAHub uses SQLite by default — a single file with zero configuration. The database is created automatically on first run.

To back up your data:
```bash
cp clahub.db clahub-backup-$(date +%Y%m%d).db
```

Prisma supports swapping to PostgreSQL if you need to scale.

---

## Custom Branding

White-label your CLAHub instance with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | CLAHub | Application name shown in the UI |
| `APP_LOGO_URL` | (CLAHub logo) | URL to your logo image |
| `APP_PRIMARY_COLOR` | `#000000` | Primary brand color (hex) |

---

## Troubleshooting

### "UntrustedHost" error

Add to your `.env`:
```
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-domain.com
```
Rebuild: `npm run build`

### PR checks not appearing

1. Verify the GitHub App is installed on the repo/org
2. Check that `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY` are set
3. Check webhook delivery in GitHub App settings → Advanced → Recent deliveries

### OAuth login fails

1. Verify callback URLs in your OAuth apps match your domain:
   - Owner: `https://your-domain.com/api/auth/callback/github-owner`
   - Contributor: `https://your-domain.com/api/auth/callback/github-contributor`
2. Verify `GITHUB_OWNER_CLIENT_ID`, `GITHUB_OWNER_CLIENT_SECRET`, `GITHUB_CONTRIBUTOR_CLIENT_ID`, `GITHUB_CONTRIBUTOR_CLIENT_SECRET` are correct

### Database errors

```bash
# Run migrations
npx prisma migrate deploy

# Verify database
sqlite3 clahub.db ".tables"
```

### Repos/orgs not showing in dropdown

1. The GitHub App must be installed on the account/org
2. You must be signed in as an Owner (not Contributor)
3. The Owner OAuth app needs `repo:status admin:repo_hook read:org` scopes

### Webhook signature verification fails

Ensure `GITHUB_WEBHOOK_SECRET` in your `.env` matches the secret configured in your GitHub App settings.

---

*CLAHub is maintained by [DamageLabs](https://damagelabs.io). Source: [github.com/DamageLabs/clahub](https://github.com/DamageLabs/clahub). Licensed under MIT.*
