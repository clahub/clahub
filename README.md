# CLAHub

CLAHub provides a low-friction way to have a Contributor License Agreement for your open source project on GitHub. Contributors digitally sign your CLA by signing in with GitHub, and pull requests are automatically marked with a status check based on whether all commit authors have signed.

Running at [clahub.com](https://www.clahub.com)

## Features

**For project owners:**

- Create CLAs from templates (Apache ICLA, DCO) or write custom ones in Markdown
- Version control for CLA text with changelogs
- Custom form fields (text, email, URL, checkbox, date)
- Automatic GitHub Check Runs on pull requests
- Bot auto-detection — accounts like `dependabot[bot]` and `renovate[bot]` are excluded automatically
- Per-user exclusions — manually bypass CLA for specific GitHub accounts
- Dashboard with signature tracking
- Full audit log of all changes

**For contributors:**

- Sign in with GitHub (minimal permissions)
- View rendered CLA, fill required fields, sign digitally
- Automatic PR re-check after signing — no need to re-push

## How it works

1. Owner installs the CLAHub GitHub App on a repository
2. Owner creates a CLA agreement for that repo
3. When a pull request is opened, CLAHub receives a webhook
4. CLAHub extracts commit authors and checks each one:
   - **Excluded** (bot pattern or manual exclusion) — skipped
   - **Signed** — has a valid, non-revoked signature on file
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
- [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) for testing

## Getting started

### Prerequisites

You need **Node.js 18+** and **npm**. You also need to set up three things on GitHub:

1. **GitHub App** — for webhook events and Check Runs
2. **GitHub OAuth App (owner)** — full scope for project owners
3. **GitHub OAuth App (contributor)** — minimal scope for CLA signers

### 1. Clone and install

```bash
git clone https://github.com/clahub/clahub.git
cd clahub
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in the values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:./clahub.db` |
| `NEXTAUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` |
| `GITHUB_APP_ID` | Yes | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub App private key (PEM) |
| `GITHUB_WEBHOOK_SECRET` | Yes | Webhook secret configured on the GitHub App |
| `GITHUB_OWNER_CLIENT_ID` | Yes | OAuth App for owners — Client ID |
| `GITHUB_OWNER_CLIENT_SECRET` | Yes | OAuth App for owners — Client secret |
| `GITHUB_CONTRIBUTOR_CLIENT_ID` | Yes | OAuth App for contributors — Client ID |
| `GITHUB_CONTRIBUTOR_CLIENT_SECRET` | Yes | OAuth App for contributors — Client secret |
| `APP_URL` | Yes | Public URL, e.g. `http://localhost:3000` |
| `SENTRY_DSN` | No | Sentry error tracking |
| `RESEND_API_KEY` | No | Email via Resend |
| `EMAIL_FROM` | No | Sender address for emails |

### 3. Set up the database

```bash
npm run db:push
npm run db:seed    # optional — creates sample data
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Webhooks in development

GitHub can't reach `localhost`, so use a tunnelling service like [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Set the forwarding URL as your GitHub App's webhook URL and update `APP_URL` in `.env.local`.

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

## Project structure

```
src/
  app/
    (marketing)/        Landing, privacy, terms, why-cla pages
    agreements/         Dashboard, create, edit, public signing page
    api/auth/           NextAuth endpoints
    api/webhooks/       GitHub App webhook handler
    auth/signin/        Sign-in page
  components/
    ui/                 shadcn/ui primitives
    agreements/         Agreement form, signing form, exclusion manager, etc.
  lib/
    actions/            Server actions (agreement, exclusion, signing)
    schemas/            Zod validation schemas
    auth.ts             NextAuth configuration (dual providers)
    cla-check.ts        Core CLA verification + exclusion logic
    github.ts           GitHub App / Octokit setup
    prisma.ts           Prisma client singleton
    templates.ts        CLA templates (Apache ICLA, DCO)
prisma/
  schema.prisma         Database schema (8 models)
  seed.ts               Sample data
tests/
  api/                  API route tests
  components/           Component tests
  e2e/                  Playwright E2E tests
```

## Database models

| Model | Purpose |
|---|---|
| `User` | GitHub users (owners and contributors) |
| `Agreement` | CLA definitions linked to a GitHub repo |
| `AgreementVersion` | Versioned CLA text with changelogs |
| `AgreementField` | Custom form fields on a CLA |
| `Signature` | User signatures (soft-deletable via `revokedAt`) |
| `FieldEntry` | Field values submitted with a signature |
| `Exclusion` | Bot/user exclusions per agreement |
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
