# Contributing to CLAHub

Thanks for your interest in contributing to CLAHub! This guide covers everything you need to get started.

## Prerequisites

- **Node.js 20+** and **npm**
- A GitHub account
- For full local testing: a [GitHub App](https://docs.github.com/en/apps/creating-github-apps) and two OAuth Apps (see the README for setup details)

## Getting started

1. **Fork and clone**

   ```bash
   git clone https://github.com/<your-username>/clahub.git
   cd clahub
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the required values — see the README's environment table for details. For running tests only, you can use placeholder values for the GitHub App credentials.

3. **Set up the database**

   ```bash
   npx prisma generate
   npm run db:push
   npm run db:seed      # optional — creates sample data
   ```

4. **Start developing**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Development workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes
3. Run checks before pushing (see below)
4. Open a pull request against `main`

### Branch naming

| Prefix | Use |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `chore/` | Config, deps, tooling |
| `docs/` | Documentation only |

If addressing a GitHub issue, include the number: `feat/123-add-feature`.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(schema): add notifyOnSign field to Agreement model
fix(actions): handle race condition in signature creation
chore(deps): update prisma to v7.4
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

## Code style

The project uses **ESLint**, **Prettier**, and **Biome** for code quality:

```bash
npm run lint        # ESLint
npm run format      # Prettier (write mode)
```

**Prettier rules** (`.prettierrc`): single quotes, semicolons, trailing commas, 100 char width, 2-space indent.

**TypeScript** is strict mode. Run the type checker with:

```bash
npx tsc --noEmit
```

## Testing

### Unit tests (Vitest)

Unit tests live in `tests/unit/` and cover schemas, utilities, server actions, and business logic.

```bash
npm test              # run once
npm run test:watch    # watch mode
```

Tests are organized by layer:

| Directory | Coverage |
|---|---|
| `tests/unit/schemas/` | Zod schema validation |
| `tests/unit/lib/` | Utilities — audit, logger, access, error handling |
| `tests/unit/actions/` | Server actions with mocked deps |
| `tests/unit/cla-check*.ts` | CLA verification logic |

### E2E tests (Playwright)

E2E tests live in `tests/e2e/` and run against a real browser.

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Playwright reuses your running dev server on port 3000. The global setup script (`tests/e2e/global-setup.ts`) resets and seeds a test database automatically.

### Before submitting a PR

Run the full check suite:

```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript
npm test              # Unit tests
npm run build         # Production build
```

CI runs all of these plus E2E tests on every pull request.

## Project structure

```
src/
  app/                  Next.js App Router pages and API routes
  components/
    ui/                 shadcn/ui primitives (Button, Card, Dialog, etc.)
    agreements/         Feature components (forms, signing, exclusions, etc.)
  lib/
    actions/            Server actions (agreement, exclusion, signing, signature)
    schemas/            Zod validation schemas
    access.ts           Role-based access control
    audit.ts            Audit logging utility
    auth.ts             Auth.js configuration
    cla-check.ts        Core CLA verification + exclusion logic
    email.ts            Resend email wrapper
    github.ts           GitHub App / Octokit setup
    logger.ts           Structured JSON logger
    prisma.ts           Prisma client singleton
  generated/prisma/     Generated Prisma client (do not edit)
prisma/
  schema.prisma         Database schema
  seed.ts               Sample data for development
  migrations/           Migration history
tests/
  unit/                 Vitest unit tests
  e2e/                  Playwright E2E tests
```

## Database

CLAHub uses **Prisma v7** with **SQLite** (better-sqlite3 adapter). Key commands:

| Command | Description |
|---|---|
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev --name <name>` | Create a new migration |
| `npm run db:push` | Push schema to database (no migration) |
| `npm run db:seed` | Seed with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |

After modifying `prisma/schema.prisma`, always run `npx prisma generate` to update the client. The generated client lives in `src/generated/prisma/` — do not edit it directly.

## Tech stack reference

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Database | Prisma v7 + SQLite (better-sqlite3) |
| Auth | Auth.js v5 with dual GitHub OAuth providers |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Validation | Zod v4 + React Hook Form |
| GitHub API | Octokit |
| Email | Resend (optional) |
| Error tracking | Sentry (optional) |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright |
| Linting | ESLint 9 + Prettier |

## Reporting issues

Open an issue at [github.com/clahub/clahub/issues](https://github.com/clahub/clahub/issues). Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS if relevant
- Error messages or screenshots

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
