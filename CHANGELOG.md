# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-02-12

Complete rewrite from Ruby on Rails to Next.js. The v1 Rails application has been
replaced with a modern TypeScript stack: Next.js 16, Prisma v7, SQLite, Auth.js,
and a GitHub App integration model.

### Added

- **Project scaffolding**: Next.js 16 with TypeScript, Tailwind CSS, and shadcn/ui component library (#204)
- **Database**: Prisma v7 ORM with SQLite via better-sqlite3 adapter; full data model for agreements, signatures, exclusions, and audit logs (#205)
- **GitHub App integration**: Octokit-based GitHub App with webhook receiver and signature verification (#206)
- **Authentication**: Auth.js v5 with dual GitHub OAuth providers — full-scope for repo owners, minimal-scope for contributors (#207)
- **Landing page and marketing**: Homepage, Why CLA, Privacy Policy, and Terms of Service pages (#208)
- **Agreement CRUD**: Create, list, edit, and soft-delete CLA agreements with GitHub repo linking (#209)
- **CLA signing flow**: Contributor signing form with Zod validation, duplicate detection, and markdown agreement preview (#210)
- **Webhook handlers**: PR opened/synchronize/reopened, push, repository rename/transfer, and installation lifecycle events (#211)
- **Async PR recheck**: Automatic re-evaluation of open PRs when a new signature is submitted, with retry logic (#212)
- **Bot auto-detection and exclusions**: Configurable user/bot exclusion lists for CLA checks, with `[bot]` suffix auto-detection (#213)
- **Brand identity**: CLAHub logo, warm amber/brown color palette, and responsive styled layout (#240)
- **Unit and E2E tests**: Vitest unit tests for schemas, utilities, and CLA logic; Playwright E2E tests for signing, dashboard, and webhook flows (#216)
- **CI/CD pipeline**: GitHub Actions workflow running lint, typecheck, unit tests, and E2E tests on every PR (#235)
- **Structured error handling**: Typed `ApiError` responses with error codes, Result utilities for server actions, error boundaries, and toast notifications (#214)
- **Audit logging**: Shared `logAudit()` utility capturing IP address, user, and action metadata for all write operations (#215)
- **Structured logging**: JSON logger with `debug`/`info`/`warn`/`error` levels, `LOG_LEVEL` env var filtering, and sensitive data scrubbing (#232)
- **Sentry integration**: Optional error tracking via `@sentry/nextjs` with server and client instrumentation, conditional on `SENTRY_DSN` env var (#232)
- **Duration tracking**: All webhook handlers and the webhook route log `durationMs` for performance observability (#232)
- **Global error boundary**: `global-error.tsx` catches errors outside the root layout and reports to Sentry (#232)

### Changed

- **Stack**: Ruby on Rails + PostgreSQL replaced with Next.js 16 + Prisma v7 + SQLite
- **Auth model**: OmniAuth replaced with Auth.js v5; dual OAuth providers instead of single provider with scope escalation
- **GitHub integration**: Repo hooks replaced with a GitHub App model using installation-level tokens
- **Hosting model**: Designed for self-hosting with SQLite (no external database required)

### Removed

- Ruby on Rails application and all associated gems
- PostgreSQL dependency
- Heroku-specific configuration
- Legacy JavaScript (jQuery, Bootstrap, Chosen)
- NewRelic and Google Analytics integrations

### Issues Closed

- [#204](https://github.com/clahub/clahub/issues/204): Project scaffolding: Next.js 15, TypeScript, Tailwind, shadcn/ui
- [#205](https://github.com/clahub/clahub/issues/205): Prisma schema and SQLite database setup
- [#206](https://github.com/clahub/clahub/issues/206): GitHub App registration and configuration
- [#207](https://github.com/clahub/clahub/issues/207): Auth.js setup with dual GitHub OAuth providers
- [#208](https://github.com/clahub/clahub/issues/208): Landing page and static marketing pages
- [#209](https://github.com/clahub/clahub/issues/209): Agreement CRUD: create, list, edit, delete
- [#210](https://github.com/clahub/clahub/issues/210): CLA signing flow with form validation
- [#211](https://github.com/clahub/clahub/issues/211): Webhook handler: process push and pull_request events
- [#212](https://github.com/clahub/clahub/issues/212): Async open PR re-check after new signature
- [#213](https://github.com/clahub/clahub/issues/213): Bot auto-detection and basic exclusions
- [#214](https://github.com/clahub/clahub/issues/214): Structured error handling and API error responses
- [#215](https://github.com/clahub/clahub/issues/215): Audit logging for all write operations
- [#216](https://github.com/clahub/clahub/issues/216): E2E tests for the core signing flow
- [#232](https://github.com/clahub/clahub/issues/232): Structured logging and error tracking (Sentry)
- [#235](https://github.com/clahub/clahub/issues/235): CI/CD pipeline: lint, test, build on PR
- [#240](https://github.com/clahub/clahub/issues/240): Restyle site around CLAHub logo and color palette
- [#243](https://github.com/clahub/clahub/issues/243): Fix 4 moderate Dependabot vulnerabilities (hono, lodash)
