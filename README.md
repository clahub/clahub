# CLAHub

[![CI](https://github.com/clahub/clahub/actions/workflows/ci.yml/badge.svg)](https://github.com/clahub/clahub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![GitHub issues](https://img.shields.io/github/issues/clahub/clahub)](https://github.com/clahub/clahub/issues)
[![GitHub stars](https://img.shields.io/github/stars/clahub/clahub)](https://github.com/clahub/clahub/stargazers)

CLAHub provides a low-friction way to have a Contributor License Agreement for your open source project on GitHub. Contributors digitally sign your CLA by signing in with GitHub, and pull requests are automatically marked with a status check based on whether all commit authors have signed.

Running at [clahub.com](https://www.clahub.com)

## Features

**For project owners:**

- Create CLAs from templates (Apache ICLA, DCO) or write custom ones in Markdown
- Version control for CLA text with changelogs
- Custom form fields (text, email, URL, checkbox, date)
- Automatic GitHub Check Runs on pull requests
- **Org-wide agreements** — create a single CLA that covers all repos in a GitHub organization
- **Role-based access** — org admins can view agreements and signatories without full owner permissions
- **Exclusion management** — exclude individual users, GitHub teams, or bots from CLA requirements
- **Manual signature entry** — add signatures by GitHub username or email
- **CSV import** — bulk-import signatures with preview, validation, and duplicate detection
- **Signature revocation** — revoke and restore signatures with automatic PR status re-check
- **Ownership transfer** — transfer agreement ownership to another registered owner
- **Email notifications** — opt-in email when contributors sign, powered by Resend
- **REST API** — full CRUD for agreements and signatures with API key authentication (`clahub_`-prefixed Bearer tokens)
- **SVG badges** — embeddable shields.io-compatible status badges for READMEs (`/api/badge/{owner}/{repo}`)
- **Rate limiting** — tiered rate limits (100/60/30 req/min) with `X-RateLimit-*` headers
- **CSV/PDF export** — download signatures as CSV or agreement documents as PDF
- **Corporate CLA (CCLA)** — a company representative signs once, covering all contributors with a matching email domain
- **Docker self-hosting** — `docker compose up -d` with auto-migration, health checks, and SQLite volume persistence
- **Custom branding** — white-label with `APP_NAME`, `APP_LOGO_URL`, `APP_PRIMARY_COLOR`
- **CONTRIBUTING.md generation** — auto-generate a CONTRIBUTING snippet with CLA signing link and badge
- **Admin dashboard** — audit log viewer and manual PR re-check on the agreement edit page
- **Health endpoint** — `GET /api/health` for uptime monitoring and container health checks
- **WCAG 2.1 AA accessible** — color contrast, ARIA labels, keyboard navigation, skip links
- Dashboard with signature tracking
- Full audit log of all changes

**For contributors:**

- Sign in with GitHub (minimal permissions)
- View rendered CLA, fill required fields, sign digitally
- Automatic PR re-check after signing — no need to re-push

## REST API

CLAHub provides a REST API at `/api/v1/` for programmatic access. Authenticate with a Bearer token (generate one under Settings > API Keys).

```bash
# List signatures for a repo agreement
curl -H "Authorization: Bearer clahub_xxxx" \
  https://clahub.com/api/v1/agreements/my-org/my-repo/signatures

# Check if a user has signed
curl https://clahub.com/api/v1/agreements/my-org/my-repo/check/username

# Export signatures as CSV
curl -H "Authorization: Bearer clahub_xxxx" \
  https://clahub.com/api/v1/agreements/my-org/my-repo/export/csv
```

Full API documentation is available in the [OpenAPI spec](public/openapi.yaml).

## Badges

Add a CLA status badge to your README:

```markdown
[![CLA](https://clahub.com/api/badge/my-org/my-repo)](https://clahub.com/agreements/my-org/my-repo)
```

Options: `?style=flat-square`, `?label=License`, `?color=4c1`.

## How it works

1. Owner installs the CLAHub GitHub App on a repository (or organization)
2. Owner creates a CLA agreement for that repo or org
3. When a pull request is opened, CLAHub receives a webhook
4. CLAHub extracts commit authors and checks each one:
   - **Excluded** (bot pattern or manual exclusion) — skipped
   - **Signed** — has a valid, non-revoked individual signature on file
   - **Corporate-covered** — email domain matches an active corporate CLA signature
   - **Unsigned** — needs to sign the CLA
5. A GitHub Check Run is posted with the result and a link to the signing page
6. After a contributor signs, all open PRs for that repo are re-checked

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, React 19)
- [Prisma](https://www.prisma.io) v7 with SQLite (better-sqlite3 adapter)
- [Auth.js](https://authjs.dev) (NextAuth v5) with dual GitHub OAuth providers
- [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) components
- [Octokit](https://github.com/octokit) for GitHub App / Checks API
- [Zod](https://zod.dev) v4 + [React Hook Form](https://react-hook-form.com) for validation
- [Resend](https://resend.com) for transactional email (optional)
- [Sentry](https://sentry.io) via `@sentry/nextjs` for error tracking (optional)
- [@react-pdf/renderer](https://react-pdf.org) for PDF export
- [PapaParse](https://www.papaparse.com) for CSV export
- [Docker](https://www.docker.com) for self-hosted deployment
- [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) for testing

## Getting started

> **Full walkthrough:** [docs/getting-started.md](docs/getting-started.md)

### Prerequisites

You need **Node.js 20+** and **npm**. You also need a GitHub App and two OAuth Apps (owner + contributor). See the [Getting Started guide](docs/getting-started.md) for step-by-step setup.

### Quick start

```bash
git clone https://github.com/clahub/clahub.git
cd clahub
npm ci
cp .env.local.example .env.local   # fill in your values
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Required env vars:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_OWNER_CLIENT_ID/SECRET`, `GITHUB_CONTRIBUTOR_CLIENT_ID/SECRET`, `APP_URL`.

**Optional:** `SENTRY_DSN`, `RESEND_API_KEY`, `LOG_LEVEL`, branding vars (`APP_NAME`, `APP_LOGO_URL`, `APP_PRIMARY_COLOR`).

See [docs/configuration.md](docs/configuration.md) for the full environment variable reference.

### Webhooks in development

GitHub can't reach `localhost`, so use [ngrok](https://ngrok.com) (`ngrok http 3000`) and update `APP_URL` in `.env.local`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## Self-hosting

The fastest way to self-host CLAHub is with Docker:

```bash
cp .env.docker.example .env   # fill in your values
docker compose up -d
```

Also supports Vercel, Railway, Fly.io, and bare-metal Node.js (PM2 / systemd).

See [Deployment Guide](docs/deployment.md) for all options and
[Upgrading Guide](docs/upgrading.md) for version updates.

## Testing

### Unit tests (Vitest)

Unit tests live in `tests/unit/` and cover pure functions, Zod schema validation, and business logic with mocked dependencies.

```bash
npm test              # run all unit tests once
npm run test:watch    # run in watch mode during development
```

Tests are organized by layer:

| Directory | What's tested |
|---|---|
| `tests/unit/schemas/` | Zod schemas — agreement, signing, exclusion |
| `tests/unit/lib/` | Utility modules — api-error, audit, logger, result, sentry, badge, rate-limit, export-csv, export-pdf |
| `tests/unit/cla-check.test.ts` | `extractPushAuthors()` pure function |
| `tests/unit/cla-check-integration.test.ts` | `checkClaForCommitAuthors`, `createCheckRun`, `extractPRAuthors` with mocked Prisma/Octokit |
| `tests/unit/lib/cla-check-corporate.test.ts` | Corporate CLA domain-based coverage with mocked Prisma |
| `tests/unit/lib/api-sign-corporate.test.ts` | Corporate signing schema validation |
| `tests/unit/actions/signing.test.ts` | `signAgreement` server action with mocked auth, Prisma, and cla-check |

### E2E tests (Playwright)

E2E tests live in `tests/e2e/` and test the signing flow, dashboard, and webhook endpoint through a real browser.

```bash
npm run test:e2e      # run all E2E tests
```

**Local development:** Playwright reuses your running dev server on port 3000. Make sure `npm run dev` is running and the database is seeded (`npm run db:seed`).

**CI:** Playwright starts its own dev server using `.env.test` and runs `prisma db push --force-reset` + `prisma db seed` against a disposable `test.db` via the global setup script.

**Authentication in tests:** E2E tests inject real JWT session cookies using `@auth/core/jwt` `encode()` with the same secret as the running server. See `tests/e2e/auth-helpers.ts` for the `authenticateAs()` helper.

**First time setup:**

```bash
npx playwright install chromium   # download browser binary (one-time)
```

## Project structure

```
src/
  app/
    (marketing)/        Landing, privacy, terms, why-cla pages
    agreements/         Dashboard, create, edit, public signing page
    api/auth/           NextAuth endpoints
    api/badge/          SVG badge endpoints (public, no auth)
    api/health/         Health check endpoint
    api/v1/             REST API (agreements, signatures, check, export)
    api/webhooks/       GitHub App webhook handler
    auth/signin/        Sign-in page
    error.tsx           Error boundary with Sentry reporting
    global-error.tsx    Global error boundary (outside root layout)
    not-found.tsx       Custom 404 page
  components/
    ui/                 shadcn/ui primitives
    agreements/         Agreement form, signing form, exclusion manager, signature manager, notification toggle, audit log viewer, recheck button, CONTRIBUTING.md section
  lib/
    actions/            Server actions (agreement, exclusion, signing, signature)
    schemas/            Zod validation schemas
    api-auth.ts         API key + session authentication
    api-error.ts        Structured API error responses with error codes
    api-rate-limit.ts   Tiered rate limiting (API key / session / anon)
    audit.ts            Shared audit logging utility
    auth.ts             NextAuth configuration (dual providers)
    access.ts           Role-based access control (owner, org_admin)
    badge.ts            SVG badge rendering (shields.io-compatible)
    branding.ts         Custom instance branding from env vars
    contributing.ts     CONTRIBUTING.md snippet generation
    cla-check.ts        Core CLA verification + exclusion + corporate coverage
    email.ts            Resend email wrapper + notification templates
    export-csv.ts       CSV export with papaparse
    export-pdf.ts       PDF export with @react-pdf/renderer
    github.ts           GitHub App / Octokit setup + webhook handlers
    logger.ts           Structured JSON logger with level filtering
    prisma.ts           Prisma client singleton
    rate-limit.ts       In-memory sliding window rate limiter
    sentry.ts           Sensitive data scrubbing utility
    templates.ts        CLA templates (Apache ICLA, DCO)
  instrumentation.ts    Server-side Sentry init (conditional on SENTRY_DSN)
  instrumentation-client.ts  Client-side Sentry init
prisma/
  schema.prisma         Database schema (9 models)
  seed.ts               Sample data
tests/
  unit/                 Vitest unit tests (schemas, lib, cla-check, actions)
  e2e/                  Playwright E2E tests (signing flow, dashboard, webhook)
  setup.ts              Vitest setup (jest-dom matchers)
Dockerfile              Multi-stage production image (node:20-alpine)
docker-compose.yml      Self-hosted deployment with SQLite volume
docker-entrypoint.sh    Auto-migration entrypoint script
docs/                   Deployment and operations documentation
```

## Database models

| Model | Purpose |
|---|---|
| `User` | GitHub users (owners and contributors) |
| `Agreement` | CLA definitions linked to a GitHub repo or org |
| `AgreementVersion` | Versioned CLA text with changelogs |
| `AgreementField` | Custom form fields on a CLA |
| `Signature` | Individual or corporate signatures (with optional company name/domain/title) |
| `FieldEntry` | Field values submitted with a signature |
| `Exclusion` | Bot/user/team exclusions per agreement |
| `ApiKey` | API keys for REST API authentication |
| `AuditLog` | Complete change history |

## What's a CLA?

Contributor License Agreements prove intellectual property provenance of contributions to an open-source project. They generally say:

> 1. The code I'm contributing is mine, and I have the right to license it.
> 2. I'm granting you a license to distribute said code under the terms of this agreement.

From [*Contributor License Agreements* by Jacob Kaplan-Moss](https://jacobian.org/writing/contributor-license-agreements/)

More background:

- [Wikipedia: Contributor License Agreement](https://en.wikipedia.org/wiki/Contributor_License_Agreement)
- [Harmony Agreements](http://www.harmonyagreements.org/) — a tool to help choose a CLA

## Legal disclaimer

None of the CLAHub documentation, functionality, or other communication constitutes legal advice. Consult your lawyer about contributor agreements for your project.

## License

[MIT](LICENSE.md) — Copyright (c) 2013-2026 Jason Morrison, Tony Guntharp
