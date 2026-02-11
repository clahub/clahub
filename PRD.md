# CLAHub v2 — Product Requirements Document

## 1. Overview

CLAHub is a GitHub-integrated platform for managing Contributor License Agreements (CLAs). Project owners create CLAs for their repositories (or entire organizations), contributors sign them via GitHub authentication, and pull request status checks are automatically updated.

**This document defines the requirements for a full rewrite** of CLAHub, replacing the legacy Ruby on Rails application with a modern Next.js/React stack. The rewrite addresses 58 accumulated issues (see [Old-Issues.md](Old-Issues.md)) and incorporates architectural decisions that resolve entire classes of bugs from the original implementation.

### 1.1 Problem Statement

The original CLAHub is non-functional (the hosted instance is down, see [#174](https://github.com/clahub/clahub/issues/174)). Even when operational, it suffered from:
- Generic 500 errors with no user feedback when signing CLAs ([#56](https://github.com/clahub/clahub/issues/56), [#113](https://github.com/clahub/clahub/issues/113), [#163](https://github.com/clahub/clahub/issues/163))
- Data loss during ownership transfers ([#158](https://github.com/clahub/clahub/issues/158))
- Broken GitHub integrations after repo renames/transfers ([#34](https://github.com/clahub/clahub/issues/34), [#150](https://github.com/clahub/clahub/issues/150), [#154](https://github.com/clahub/clahub/issues/154))
- Webhook timeouts on Heroku ([#38](https://github.com/clahub/clahub/issues/38))
- No support for private repos, organizations, bots, or programmatic access
- No CLA versioning, notifications, or admin controls

### 1.2 Goals

1. **Reliable core loop:** Owner creates CLA -> contributor signs -> PR status updates. This must work every time.
2. **Organization-first:** Support org-wide CLAs, team exclusions, and shared admin access from day one.
3. **Self-hostable:** A single deployable unit (Next.js + SQLite) that any organization can run on their own infrastructure.
4. **API-first:** Every feature accessible via REST API, enabling bot and CI/CD integrations.
5. **Modern DX:** TypeScript, type-safe database, proper error handling, automated testing.

### 1.3 Non-Goals (v2.0)

- GitLab/Bitbucket support (architect for it, but don't implement yet)
- i18n / translations
- Blockchain-based signature verification
- Mobile-native apps

---

## 2. User Personas

### Owner
A project maintainer or organization admin who creates and manages CLAs. Needs to:
- Create CLAs for individual repos or entire orgs
- View and export who has signed
- Configure exclusions (bots, core team members)
- Receive notifications when new signatures arrive
- Transfer ownership to other users or orgs
- Revoke signatures if needed

### Contributor
An open-source contributor who needs to sign a CLA before their PR can be merged. Needs to:
- Authenticate with GitHub (minimal permissions)
- Read and sign the CLA with minimal friction
- See clear feedback on success or errors
- Be redirected back to their PR after signing

### Bot / CI System
An automated system (Dependabot, Renovate, custom bots) that creates PRs. Needs to:
- Be automatically excluded from CLA requirements
- Query signature status via API

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + API routes in one deployable |
| Language | TypeScript | Full-stack type safety |
| Database | SQLite (via Prisma) | Zero-ops, single-file, self-hostable; Prisma allows swapping to Postgres/Turso later |
| Auth | Auth.js v5 (NextAuth) | GitHub OAuth with dual-provider support |
| GitHub Integration | GitHub App + Octokit.js | Replaces OAuth webhooks; uses Checks API |
| Styling | Tailwind CSS + shadcn/ui | Modern, accessible, tree-shaken |
| Forms | React Hook Form + Zod | Client + server validation with type inference |
| Markdown | react-markdown + remark-gfm | Client-side rendering, no server round-trip |
| Email | Resend (or any SMTP) | Transactional notifications |
| Testing | Vitest + Playwright + React Testing Library | Unit, integration, E2E |
| Deployment | Docker / Vercel / any Node.js host | Flexible deployment targets |

---

## 4. Architecture Decisions

These decisions are derived from patterns observed across all 58 legacy issues. Each resolves multiple bugs simultaneously.

### AD-1: GitHub App (not OAuth App webhooks)
**Resolves:** [#38](https://github.com/clahub/clahub/issues/38), [#55](https://github.com/clahub/clahub/issues/55), [#86](https://github.com/clahub/clahub/issues/86), [#87](https://github.com/clahub/clahub/issues/87), [#133](https://github.com/clahub/clahub/issues/133), [#150](https://github.com/clahub/clahub/issues/150), [#153](https://github.com/clahub/clahub/issues/153), [#165](https://github.com/clahub/clahub/issues/165)

Register a GitHub App instead of two OAuth Apps. The App receives webhook events at the installation level, supports private repos, handles retries automatically, and provides fine-grained permissions. Contributors still authenticate via GitHub OAuth (minimal scope) for identity verification.

### AD-2: Numeric GitHub repository IDs as primary identifiers
**Resolves:** [#34](https://github.com/clahub/clahub/issues/34), [#150](https://github.com/clahub/clahub/issues/150), [#154](https://github.com/clahub/clahub/issues/154), [#168](https://github.com/clahub/clahub/issues/168)

Store `githubRepoId` (numeric, stable) as the canonical repo identifier. Store `ownerName`/`repoName` as denormalized display fields, updated automatically when `repository.renamed` or `repository.transferred` events arrive.

### AD-3: GitHub Checks API (not Statuses API)
**Resolves:** [#51](https://github.com/clahub/clahub/issues/51), [#55](https://github.com/clahub/clahub/issues/55), [#153](https://github.com/clahub/clahub/issues/153)

Use the Checks API for PR status reporting. It provides richer output (summary, details URL, annotations), appears in a dedicated "Checks" tab on PRs, and is the modern standard. The GitHub App model is required for the Checks API.

### AD-4: Transactional mutations with audit logging
**Resolves:** [#158](https://github.com/clahub/clahub/issues/158), [#161](https://github.com/clahub/clahub/issues/161)

All write operations (create agreement, sign, transfer ownership, delete) run inside database transactions. An `AuditLog` table records every mutation with the acting user, action type, and before/after state. Soft deletes on agreements and signatures enable recovery.

### AD-5: Structured error responses
**Resolves:** [#56](https://github.com/clahub/clahub/issues/56), [#113](https://github.com/clahub/clahub/issues/113), [#163](https://github.com/clahub/clahub/issues/163)

All API routes return structured JSON errors with field-level validation details. The React frontend displays per-field errors inline and global errors in toast notifications. No generic "something went wrong" pages.

### AD-6: Org-scoped data model
**Resolves:** [#82](https://github.com/clahub/clahub/issues/82), [#103](https://github.com/clahub/clahub/issues/103), [#107](https://github.com/clahub/clahub/issues/107), [#146](https://github.com/clahub/clahub/issues/146)

Agreements can be scoped to a single repository or an entire GitHub organization. Exclusion lists (by username, team, or bot detection) exempt specified accounts from CLA requirements. Org members with admin access can view signatories (RBAC).

---

## 5. Data Model

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // file:./clahub.db
}

model User {
  id            Int         @id @default(autoincrement())
  githubId      String      @unique                       // Stable GitHub user ID
  nickname      String                                     // GitHub login
  email         String?
  name          String?
  avatarUrl     String?
  oauthToken    String?                                    // Only stored for owners (full-access)
  role          String      @default("contributor")        // "contributor" | "owner" | "admin"
  agreements    Agreement[] @relation("AgreementOwner")
  signatures    Signature[]
  auditLogs     AuditLog[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Agreement {
  id              Int              @id @default(autoincrement())
  // GitHub identifiers — githubRepoId is the stable key (AD-2)
  scope           String           @default("repo")        // "repo" | "org"
  githubRepoId    String?          @unique                 // Numeric repo ID (null for org-scope)
  githubOrgId     String?                                  // Numeric org ID (for org-scope)
  ownerName       String                                   // Denormalized, updated on rename
  repoName        String?                                  // Null for org-scoped agreements
  // Content
  owner           User             @relation("AgreementOwner", fields: [ownerId], references: [id])
  ownerId         Int
  versions        AgreementVersion[]
  signatures      Signature[]
  fields          AgreementField[]
  exclusions      Exclusion[]
  // GitHub App integration
  installationId  String?                                  // GitHub App installation ID
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?                                // Soft delete (AD-4)

  @@index([ownerId])
  @@index([githubOrgId])
}

model AgreementVersion {
  id          Int        @id @default(autoincrement())
  agreement   Agreement  @relation(fields: [agreementId], references: [id], onDelete: Cascade)
  agreementId Int
  version     Int                                          // Sequential version number
  text        String                                       // CLA Markdown text
  changelog   String?                                      // What changed from previous version
  signatures  Signature[]
  createdAt   DateTime   @default(now())

  @@unique([agreementId, version])
}

model AgreementField {
  id          Int          @id @default(autoincrement())
  agreement   Agreement    @relation(fields: [agreementId], references: [id], onDelete: Cascade)
  agreementId Int
  label       String
  dataType    String                                       // "text" | "string" | "email" | "agree"
  required    Boolean      @default(true)
  description String?
  sortOrder   Int          @default(0)
  enabled     Boolean      @default(true)
  entries     FieldEntry[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([agreementId])
}

model Signature {
  id          Int              @id @default(autoincrement())
  user        User             @relation(fields: [userId], references: [id])
  userId      Int
  agreement   Agreement        @relation(fields: [agreementId], references: [id])
  agreementId Int
  version     AgreementVersion @relation(fields: [versionId], references: [id])
  versionId   Int                                          // Which version they signed
  source      String           @default("online")          // "online" | "manual" | "imported"
  ipAddress   String?
  signedAt    DateTime         @default(now())
  revokedAt   DateTime?                                    // Soft revoke (AD-4)
  entries     FieldEntry[]

  @@unique([userId, agreementId])
  @@index([agreementId])
}

model FieldEntry {
  id               Int            @id @default(autoincrement())
  signature        Signature      @relation(fields: [signatureId], references: [id], onDelete: Cascade)
  signatureId      Int
  field            AgreementField @relation(fields: [fieldId], references: [id])
  fieldId          Int
  value            String?

  @@unique([signatureId, fieldId])
}

model Exclusion {
  id          Int       @id @default(autoincrement())
  agreement   Agreement @relation(fields: [agreementId], references: [id], onDelete: Cascade)
  agreementId Int
  type        String                                       // "user" | "team" | "bot_auto"
  githubLogin String?                                      // Username pattern (e.g., "*[bot]")
  githubTeamId String?                                     // GitHub team ID
  createdAt   DateTime  @default(now())

  @@index([agreementId])
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  user        User?    @relation(fields: [userId], references: [id])
  userId      Int?
  action      String                                       // "agreement.create" | "signature.sign" | "agreement.transfer" | etc.
  entityType  String                                       // "agreement" | "signature" | etc.
  entityId    Int
  before      String?                                      // JSON snapshot
  after       String?                                      // JSON snapshot
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
}
```

---

## 6. Functional Requirements

### Milestone 1: Core Loop (MVP)

The essential CLA signing workflow. Owner creates, contributor signs, PR status updates.

#### FR-1.1: GitHub App Installation
- Owner installs the CLAHub GitHub App on their repo or org
- App requests permissions: `checks:write`, `pull_requests:read`, `contents:read`, `members:read`
- App subscribes to events: `pull_request`, `push`, `repository`, `installation`
- Installation ID is stored for API calls

#### FR-1.2: Authentication
- **Owners** authenticate via GitHub OAuth (full scope) to get a token for GitHub API calls
- **Contributors** authenticate via GitHub OAuth (no scope) for identity verification only
- Session managed via Auth.js with JWT strategy
- Only verified email addresses are used for CLA matching (resolves [#29](https://github.com/clahub/clahub/issues/29))

#### FR-1.3: Agreement CRUD
- Owner creates an agreement for a repo or org by selecting from installed repos/orgs
- Agreement stores the GitHub numeric repo/org ID as the stable identifier
- CLA text is authored in Markdown with live client-side preview
- CLA template selector offers common templates (Apache ICLA, DCO, custom) to help owners choose (resolves [#2](https://github.com/clahub/clahub/issues/2))
- Owner can edit CLA text after creation; each edit creates a new version (resolves [#10](https://github.com/clahub/clahub/issues/10), [#162](https://github.com/clahub/clahub/issues/162))
- Existing signatures remain tied to the version they signed
- Owner can delete an agreement (soft delete with audit log)
- On delete, pending commit statuses are cleared (resolves [#164](https://github.com/clahub/clahub/issues/164))

#### FR-1.4: CLA Signing
- Contributor views the CLA (rendered Markdown) at `/agreements/:owner/:repo`
- Contributor authenticates via GitHub OAuth (minimal scope)
- Contributor fills out required form fields and submits
- Form validates client-side (Zod) and server-side with field-level error messages (resolves [#56](https://github.com/clahub/clahub/issues/56), [#113](https://github.com/clahub/clahub/issues/113), [#163](https://github.com/clahub/clahub/issues/163))
- Signature is recorded with version reference, IP address, and timestamp
- After signing, contributor is redirected back to their GitHub PR if a referrer is available (resolves [#46](https://github.com/clahub/clahub/issues/46))

#### FR-1.5: PR Status Checks
- When a PR is opened or a push is made, the webhook handler checks all commit authors/committers
- For each author: look up by GitHub user ID, then by verified email
- If all authors have signed the current CLA, set check to "success"
- If any author has not signed, set check to "failure" with a link to the agreement page
- After a new signature, re-check all open PRs for that repo asynchronously (resolves [#1](https://github.com/clahub/clahub/issues/1), [#133](https://github.com/clahub/clahub/issues/133))
- Handle `repository.renamed` and `repository.transferred` events by updating denormalized names (resolves [#150](https://github.com/clahub/clahub/issues/150))
- All webhook processing is async — return 200 immediately, process in background (resolves [#38](https://github.com/clahub/clahub/issues/38))

#### FR-1.6: Bot Detection
- GitHub accounts with `type: "Bot"` are automatically excluded from CLA requirements (resolves [#146](https://github.com/clahub/clahub/issues/146))
- Owners can add additional exclusions by username or GitHub team

### Milestone 2: Admin & Organization Features

#### FR-2.1: Org-Wide Agreements
- Owner creates a single agreement covering all repos in a GitHub org (resolves [#82](https://github.com/clahub/clahub/issues/82))
- When the App is installed on an org, all repos under that org inherit the CLA
- New repos added to the org are automatically covered

#### FR-2.2: Role-Based Access
- Org members with admin access can view signatories for org agreements (resolves [#103](https://github.com/clahub/clahub/issues/103))
- Agreement owner can transfer ownership to another user or org (resolves [#168](https://github.com/clahub/clahub/issues/168))
- Transfer is a database transaction; failure rolls back completely (resolves [#158](https://github.com/clahub/clahub/issues/158))

#### FR-2.3: Exclusion Management
- Owner configures exclusion rules per agreement (resolves [#107](https://github.com/clahub/clahub/issues/107))
- Exclusion types: specific GitHub users, GitHub teams, bot auto-detection
- Excluded users bypass CLA checks; their PRs get automatic "success" status

#### FR-2.4: Signature Management
- Owner can manually add signatures (name, email, date) for offline-signed CLAs (resolves [#32](https://github.com/clahub/clahub/issues/32))
- Owner can revoke signatures; open PRs from revoked users are re-checked (resolves [#31](https://github.com/clahub/clahub/issues/31))
- Owner can import signatures from CSV (resolves [#112](https://github.com/clahub/clahub/issues/112))

#### FR-2.5: Notifications
- Owner receives email notification when a new signature is recorded (resolves [#43](https://github.com/clahub/clahub/issues/43))
- Optional: attach CSV of all signers to notification email (resolves [#128](https://github.com/clahub/clahub/issues/128))
- Notification preferences configurable per agreement (on/off, digest frequency)

### Milestone 3: API & Integrations

#### FR-3.1: REST API
- All agreement and signature operations available via REST API (resolves [#157](https://github.com/clahub/clahub/issues/157))
- Endpoints:
  - `GET /api/agreements/:owner/:repo` — agreement details
  - `GET /api/agreements/:owner/:repo/signatures` — list signatures (paginated)
  - `GET /api/agreements/:owner/:repo/check/:username` — check if a user has signed
  - `POST /api/agreements/:owner/:repo/signatures` — sign (authenticated)
  - `POST /api/agreements` — create agreement (owner-only)
  - `PUT /api/agreements/:owner/:repo` — update agreement (owner-only)
  - `DELETE /api/agreements/:owner/:repo` — delete agreement (owner-only)
- Authentication via API key (generated per agreement owner) or OAuth session

#### FR-3.2: Data Export
- CSV export of all signatures with metadata (name, email, date, version signed, IP)
- PDF export of signed agreement with proper formatting (resolves [#169](https://github.com/clahub/clahub/issues/169))
- Badge/shield endpoint: `GET /api/badge/:owner/:repo` returns SVG (resolves [#143](https://github.com/clahub/clahub/issues/143))

#### FR-3.3: Corporate CLA Support
- Agreements can have two texts: individual and corporate (resolves [#4](https://github.com/clahub/clahub/issues/4), [#151](https://github.com/clahub/clahub/issues/151))
- Corporate signer signs on behalf of an organization
- Corporate signature covers all contributors with a verified email matching the company's domain
- Corporate contributor info fields are only required when signing the corporate CLA (resolves [#70](https://github.com/clahub/clahub/issues/70))

### Milestone 4: Polish

#### FR-4.1: CONTRIBUTING.md Integration
- After agreement creation, detect if CONTRIBUTING.md exists in the repo (resolves [#3](https://github.com/clahub/clahub/issues/3))
- Provide a one-click link to create/edit CONTRIBUTING.md on GitHub with CLA link pre-filled

#### FR-4.2: Self-Hosting Support
- Docker image for single-command deployment (resolves [#19](https://github.com/clahub/clahub/issues/19))
- Environment variables for branding (app name, logo URL, primary color)
- SQLite by default; Postgres connection string as optional override
- Deployment documentation for Docker, Vercel, Railway, Fly.io

#### FR-4.3: Admin Dashboard
- Health check page showing GitHub App installation status, webhook delivery health
- Audit log viewer for all mutations
- "Re-check" button to manually trigger PR status re-evaluation (resolves [#133](https://github.com/clahub/clahub/issues/133))

---

## 7. Non-Functional Requirements

### NFR-1: Performance
- Agreement page loads in < 1 second (SSR)
- Webhook processing returns 200 within 500ms; background job completes within 30 seconds
- API responses < 200ms for read operations

### NFR-2: Reliability
- All write operations are transactional with rollback on failure
- Webhook processing has retry logic (3 attempts with exponential backoff)
- Soft deletes on all user-facing entities; hard deletes only via admin

### NFR-3: Security
- Only verified GitHub emails used for CLA matching
- CSRF protection on all form submissions (Auth.js built-in)
- Webhook signature validation (GitHub App secret)
- API keys are hashed before storage
- No OAuth tokens stored for contributors (minimal scope)
- Rate limiting on API endpoints

### NFR-4: Observability
- Structured JSON logging for all API routes
- Error tracking integration (Sentry)
- Audit log for every write operation
- Webhook delivery log with request/response details

### NFR-5: Testing
- Unit tests for all business logic (Vitest)
- Component tests for all form interactions (React Testing Library)
- E2E tests covering the complete signing flow (Playwright)
- API integration tests for all REST endpoints
- Target: 80% code coverage

### NFR-6: Accessibility
- WCAG 2.1 AA compliance for all pages
- Keyboard navigation for all interactive elements
- Screen reader support via shadcn/ui accessible primitives
- Proper print stylesheet for CLA legal documents

---

## 8. Pages & Routes

| Route | Page | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/terms` | Terms of service | Public |
| `/privacy` | Privacy policy | Public |
| `/why-cla` | Why CLAs matter | Public |
| `/agreements` | Dashboard: user's agreements + signatures | Owner |
| `/agreements/new` | Create agreement form | Owner |
| `/agreements/:owner/:repo` | View + sign agreement | Public (sign requires auth) |
| `/agreements/:owner/:repo/admin` | Agreement admin (signers, exclusions, settings) | Owner |
| `/api/auth/*` | Auth.js endpoints | — |
| `/api/agreements/*` | REST API | API key or session |
| `/api/webhooks/github` | GitHub App webhook receiver | GitHub signature |
| `/api/badge/:owner/:repo` | SVG badge | Public |

---

## 9. Delivery Phases

### Phase 1 — Foundation (Milestone 1)
- Next.js project setup, Prisma schema, Auth.js with GitHub
- GitHub App registration and webhook receiver
- Agreement CRUD with Markdown editor
- CLA signing flow with form validation
- PR status checks via Checks API
- Async webhook processing
- Bot auto-detection
- E2E tests for the core signing loop

### Phase 2 — Admin (Milestone 2)
- Org-wide agreements
- RBAC for org members
- Exclusion management (users, teams, bots)
- Manual signature entry + CSV import
- Signature revocation
- Email notifications
- Ownership transfer (transactional)

### Phase 3 — API & Integrations (Milestone 3)
- REST API with API key auth
- CSV + PDF export
- Badge/shield endpoint
- Corporate CLA support (individual + corporate texts)

### Phase 4 — Polish (Milestone 4)
- CONTRIBUTING.md integration
- Self-hosting Docker image
- Environment-based branding
- Admin dashboard (health, audit log, re-check)
- Deployment documentation

---

## 10. Success Metrics

| Metric | Target |
|---|---|
| Core signing flow success rate | > 99% (no generic errors) |
| Webhook processing success rate | > 99.5% |
| Time from signature to PR status update | < 30 seconds |
| Agreement page load time (p95) | < 1 second |
| E2E test pass rate | 100% |
| Zero data loss incidents | 0 (audit log + transactions) |

---

## Appendix: Referenced Documents

- [Analysis.md](Analysis.md) — Technical analysis of the legacy codebase and proposed architecture
- [Old-Issues.md](Old-Issues.md) — Full analysis of all 58 legacy GitHub issues with links
