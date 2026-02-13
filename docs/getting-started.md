# Getting Started

This guide walks you through setting up CLAHub for local development.

## Prerequisites

- **Node.js** 20 or later
- **npm** (included with Node.js)
- **Git**
- A **GitHub account** with permission to create GitHub Apps and OAuth Apps

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/clahub/clahub.git
cd clahub
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the required values. See the [Configuration Guide](./configuration.md) for a full reference of every variable and a step-by-step GitHub App setup walkthrough.

At minimum you need:

- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate one
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`
- `GITHUB_OWNER_CLIENT_ID`, `GITHUB_OWNER_CLIENT_SECRET`
- `GITHUB_CONTRIBUTOR_CLIENT_ID`, `GITHUB_CONTRIBUTOR_CLIENT_SECRET`

### 4. Set up the database

```bash
npx prisma db push
```

This creates the SQLite database file and applies the schema. The command is idempotent — safe to run multiple times.

### 5. Start the dev server

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start the Next.js development server |
| `build` | `npm run build` | Create an optimized production build |
| `start` | `npm run start` | Start the production server |
| `test` | `npm test` | Run unit tests with Vitest |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |
| `test:e2e` | `npm run test:e2e` | Run end-to-end tests with Playwright |
| `lint` | `npm run lint` | Lint the codebase with ESLint |
| `format` | `npm run format` | Format code with Prettier |
| `db:push` | `npm run db:push` | Push the Prisma schema to the database |
| `db:seed` | `npm run db:seed` | Seed the database with sample data |
| `db:studio` | `npm run db:studio` | Open Prisma Studio (visual database browser) |

## Next Steps

- [Configuration Guide](./configuration.md) — full environment variable reference and GitHub App setup
- [Deployment Guide](./deployment.md) — deploy to Docker, Vercel, Railway, Fly.io, or bare metal
- [Upgrading Guide](./upgrading.md) — update to new versions safely
