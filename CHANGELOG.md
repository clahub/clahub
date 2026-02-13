# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.3.0] - 2026-02-12

Phase 4: Production Readiness. Adds Docker self-hosting, WCAG 2.1 AA
accessibility, health endpoint, custom branding, admin dashboard tools,
CONTRIBUTING.md generation, and comprehensive deployment documentation.

### Added

- **Docker self-hosting**: Multi-stage `Dockerfile`, `docker-compose.yml` with named volume for SQLite persistence, auto-migration entrypoint, and health checks (#229)
- **Custom branding**: `APP_NAME`, `APP_LOGO_URL`, and `APP_PRIMARY_COLOR` environment variables to white-label a CLAHub instance (#229)
- **Health endpoint**: `GET /api/health` returns application status and database connectivity for monitoring and container health checks (#229)
- **WCAG 2.1 AA accessibility**: Color contrast fixes, ARIA labels, keyboard navigation, skip-to-content link, focus rings, and Playwright axe-core tests (#230)
- **Admin dashboard**: Audit log viewer and manual PR re-check on the agreement edit page (#228)
- **CONTRIBUTING.md generation**: Auto-generate a `CONTRIBUTING.md` snippet with CLA signing instructions and badge for any agreement (#228)
- **Deployment documentation**: Getting started, configuration reference, deployment guides (Docker, Vercel, Railway, Fly.io, PM2/systemd), and upgrading guide (#231)

### Fixed

- Color contrast violations for muted text and accent headings (#230)
- User menu button missing accessible label (#230)
- PR re-check feedback using `useTransition` replaced with `useState` for reliability (#228)
- CONTRIBUTING.md badge URL uses public GitHub API instead of installation token (#228)

### Issues Closed

- [#228](https://github.com/clahub/clahub/issues/228): Admin dashboard: audit log, re-check, CONTRIBUTING.md
- [#229](https://github.com/clahub/clahub/issues/229): Docker self-hosting with Dockerfile and Compose
- [#230](https://github.com/clahub/clahub/issues/230): WCAG 2.1 AA accessibility improvements
- [#231](https://github.com/clahub/clahub/issues/231): Deployment documentation

## [2.2.0] - 2026-02-12

Phase 3: API & Integrations. Adds a full REST API with key authentication,
SVG badges, rate limiting, CSV/PDF export, and corporate CLA support.

### Added

- **REST API with API key authentication**: Full CRUD for agreements and signatures via `/api/v1/`, Bearer token auth with `clahub_`-prefixed API keys, paginated responses (#224)
- **SVG badge/shield endpoint**: Embeddable shields.io-compatible badges at `/api/badge/{owner}` and `/api/badge/{owner}/{repo}` with `flat` and `flat-square` styles, custom labels, and 5-minute cache with ETag (#226)
- **Rate limiting**: In-memory sliding window rate limiter on all API and badge endpoints — 100 req/min (API key), 60 req/min (session), 30 req/min (anonymous) with `X-RateLimit-*` and `Retry-After` headers (#233)
- **CSV and PDF export**: Download signature data as CSV or agreement documents as PDF via `/api/v1/agreements/.../export/csv` and `.../export/pdf`, with optional revoked signatures and signatory lists (#225)
- **Corporate CLA (CCLA) support**: Individual/corporate toggle on signing form with company name, email domain, and title fields; domain-based coverage so employees of a signing company pass CLA checks automatically (#227)
- **OpenAPI 3.0 specification**: Full API documentation at `public/openapi.yaml` covering all endpoints, schemas, and error responses

### Issues Closed

- [#224](https://github.com/clahub/clahub/issues/224): REST API with API key authentication
- [#225](https://github.com/clahub/clahub/issues/225): CSV and PDF export of signatures
- [#226](https://github.com/clahub/clahub/issues/226): SVG badge/shield endpoint
- [#227](https://github.com/clahub/clahub/issues/227): Corporate CLA (CCLA) support
- [#233](https://github.com/clahub/clahub/issues/233): Rate limiting on API endpoints

## [2.1.0] - 2026-02-12

Phase 2: Admin tools and agreement management. Adds org-wide agreements,
role-based access, exclusion management, ownership transfer, manual/CSV
signature entry, revocation, and email notifications.

### Added

- **Org-wide CLA agreements**: Create CLA agreements scoped to an entire GitHub organization, not just individual repositories (#217)
- **Role-based access control**: Org admins can view agreements and signatories for their organization without full owner permissions (#218)
- **Exclusion management UI**: Manage CLA exclusions for individual users, GitHub teams, and bot accounts with auto-detection toggle (#219)
- **Ownership transfer**: Transfer agreement ownership to another registered owner with transactional safety and audit logging (#220)
- **Manual signature entry**: Add individual signatures manually by GitHub username or email with GitHub API user resolution (#221)
- **CSV signature import**: Bulk-import signatures from CSV files with preview, validation, duplicate detection, and error reporting (#221)
- **Signature revocation**: Revoke and restore signatures with confirmation dialog, automatic PR status re-check on revocation (#222)
- **Email notifications**: Per-agreement toggle to receive email when contributors sign, powered by Resend with graceful no-op when unconfigured (#223)

### Issues Closed

- [#217](https://github.com/clahub/clahub/issues/217): Org-wide CLA agreements
- [#218](https://github.com/clahub/clahub/issues/218): Role-based access control for org members
- [#219](https://github.com/clahub/clahub/issues/219): Exclusion management UI: users, teams, bots
- [#220](https://github.com/clahub/clahub/issues/220): Ownership transfer with transactional safety
- [#221](https://github.com/clahub/clahub/issues/221): Manual signature entry and CSV import
- [#222](https://github.com/clahub/clahub/issues/222): Signature revocation with PR status re-check
- [#223](https://github.com/clahub/clahub/issues/223): Email notifications for new signatures

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
