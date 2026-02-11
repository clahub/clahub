# CLAHub: Current State Analysis

**What it does:** CLAHub is a GitHub-integrated Contributor License Agreement (CLA) management platform. Project owners create CLAs for their repos, contributors sign them via GitHub OAuth, and PR status checks are automatically updated on GitHub.

**Current stack:** Ruby on Rails, PostgreSQL, ERB templates, jQuery, Bootstrap, OmniAuth, deployed on Heroku.

**Core features:**
- Dual GitHub OAuth (full-access for owners, limited for signers)
- CRUD for CLA agreements per repo
- Digital signature collection with custom form fields
- GitHub webhooks to process push/PR events
- Commit status API integration (marks PRs as pass/fail)
- CSV export of signatures
- Live Markdown preview for CLA text

---

## Modern React Architecture Proposal

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | **Next.js 15 (App Router)** | SSR, API routes, file-based routing — replaces both Rails views and controllers |
| **Language** | **TypeScript** | Type safety across the full stack |
| **Database** | **PostgreSQL + Prisma** | Same DB, modern type-safe ORM replacing ActiveRecord |
| **Auth** | **NextAuth.js (Auth.js v5)** | Built-in GitHub OAuth provider, supports dual-provider pattern |
| **Styling** | **Tailwind CSS + shadcn/ui** | Replaces Bootstrap with a modern, composable component system |
| **State** | **TanStack Query (React Query)** | Server-state management, caching, optimistic updates |
| **Markdown** | **react-markdown + remark-gfm** | Client-side Markdown rendering, replaces Kramdown |
| **Forms** | **React Hook Form + Zod** | Replaces Rails form helpers with validated, type-safe forms |
| **Testing** | **Vitest + Playwright + React Testing Library** | Replaces RSpec/Capybara |
| **Deployment** | **Vercel** (or Docker on any platform) | Natural fit for Next.js; Heroku still works too |

### Project Structure

```
clahub/
├── prisma/
│   ├── schema.prisma          # Database schema (replaces Rails migrations + schema.rb)
│   └── seed.ts                # Seed data (replaces db/seeds.rb)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout (replaces layouts/application.html.erb)
│   │   ├── page.tsx           # Landing page (replaces pages/home)
│   │   ├── (auth)/
│   │   │   └── api/auth/[...nextauth]/route.ts  # Auth endpoints
│   │   ├── (marketing)/
│   │   │   ├── why-cla/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── agreements/
│   │   │   ├── page.tsx                          # Index (list user's agreements)
│   │   │   ├── new/page.tsx                      # Create agreement form
│   │   │   └── [owner]/[repo]/
│   │   │       ├── page.tsx                      # Show/sign agreement
│   │   │       └── signatures.csv/route.ts       # CSV export (Route Handler)
│   │   └── api/
│   │       ├── agreements/route.ts               # POST create
│   │       ├── agreements/[owner]/[repo]/
│   │       │   ├── route.ts                      # PUT/DELETE
│   │       │   └── signatures/route.ts           # POST sign
│   │       ├── webhooks/github/route.ts          # GitHub webhook handler
│   │       ├── markdown-preview/route.ts         # Markdown preview API
│   │       └── repos/route.ts                    # List user's GitHub repos
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   │   ├── navbar.tsx
│   │   ├── agreement-form.tsx
│   │   ├── signature-form.tsx
│   │   ├── signing-users-table.tsx
│   │   ├── markdown-editor.tsx       # Live preview editor
│   │   ├── repo-selector.tsx         # Replaces Chosen dropdown
│   │   └── transfer-owner-dialog.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config with dual GitHub providers
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── github.ts          # GitHub API client (Octokit)
│   │   ├── commit-group.ts    # Webhook commit analysis logic
│   │   └── check-open-pulls.ts
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── tests/
│   ├── e2e/                   # Playwright tests (replaces acceptance specs)
│   ├── api/                   # API route tests (replaces request specs)
│   └── components/            # Component unit tests
├── .env.local                 # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Key Implementation Details

#### 1. Prisma Schema (replaces 12 Rails migrations + schema.rb)

```prisma
model User {
  id         Int         @id @default(autoincrement())
  uid        String      @unique
  oauthToken String?     @map("oauth_token")
  nickname   String
  email      String?
  name       String?
  agreements Agreement[]
  signatures Signature[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model Agreement {
  id              Int              @id @default(autoincrement())
  userName        String           @map("user_name")
  repoName        String           @map("repo_name")
  text            String
  user            User             @relation(fields: [userId], references: [id])
  userId          Int              @map("user_id")
  githubRepoHookId Int?           @map("github_repo_hook_id")
  signatures      Signature[]
  agreementFields AgreementField[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([userName, repoName])
  @@index([userId])
}

model Signature {
  id           Int          @id @default(autoincrement())
  user         User         @relation(fields: [userId], references: [id])
  userId       Int          @map("user_id")
  agreement    Agreement    @relation(fields: [agreementId], references: [id])
  agreementId  Int          @map("agreement_id")
  fieldEntries FieldEntry[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@unique([userId, agreementId])
}

model Field {
  id               Int              @id @default(autoincrement())
  label            String
  dataType         String           @map("data_type")  // "text" | "string" | "agree"
  enabledByDefault Boolean          @default(true)
  description      String?
  agreementFields  AgreementField[]
}

model AgreementField {
  id          Int          @id @default(autoincrement())
  agreement   Agreement    @relation(fields: [agreementId], references: [id], onDelete: Cascade)
  agreementId Int          @map("agreement_id")
  field       Field        @relation(fields: [fieldId], references: [id])
  fieldId     Int          @map("field_id")
  enabled     Boolean      @default(true)
  fieldEntries FieldEntry[]

  @@unique([agreementId, fieldId])
}

model FieldEntry {
  id               Int            @id @default(autoincrement())
  signature        Signature      @relation(fields: [signatureId], references: [id], onDelete: Cascade)
  signatureId      Int            @map("signature_id")
  agreementField   AgreementField @relation(fields: [agreementFieldId], references: [id])
  agreementFieldId Int            @map("agreement_field_id")
  value            String?

  @@unique([signatureId, agreementFieldId])
}
```

#### 2. Dual GitHub OAuth (replaces OmniAuth dual-provider setup)

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Full-access provider for repo owners
    GitHub({
      id: "github-owner",
      clientId: process.env.GITHUB_KEY,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "user:email repo:status admin:repo_hook read:org",
        },
      },
    }),
    // Limited provider for contributors (signing only)
    GitHub({
      id: "github-contributor",
      clientId: process.env.GITHUB_LIMITED_KEY,
      clientSecret: process.env.GITHUB_LIMITED_SECRET,
      authorization: { params: { scope: "" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "github-owner") {
        token.accessToken = account.access_token
      }
      return token
    },
  },
})
```

#### 3. GitHub API Client (replaces `github_api` gem + `GithubRepos` lib)

```typescript
// src/lib/github.ts
import { Octokit } from "@octokit/rest"

export function createGithubClient(token: string) {
  return new Octokit({ auth: token })
}

export async function getUserRepos(token: string) {
  const octokit = createGithubClient(token)
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    per_page: 100, sort: "full_name",
  })
  return repos.filter(r => r.permissions?.admin)
}

export async function createRepoWebhook(
  token: string, owner: string, repo: string
) {
  const octokit = createGithubClient(token)
  return octokit.repos.createWebhook({
    owner, repo,
    config: {
      url: `${process.env.HOST}/api/webhooks/github`,
      content_type: "json",
    },
    events: ["pull_request", "push"],
  })
}

export async function setCommitStatus(
  token: string, owner: string, repo: string,
  sha: string, state: "success" | "failure", description: string
) {
  const octokit = createGithubClient(token)
  return octokit.repos.createCommitStatus({
    owner, repo, sha, state, description,
    context: "clahub",
    target_url: `${process.env.NEXTAUTH_URL}/agreements/${owner}/${repo}`,
  })
}
```

#### 4. Webhook Handler (replaces `GithubWebhooksController` + `CommitGroup`)

```typescript
// src/app/api/webhooks/github/route.ts
import { NextRequest, NextResponse } from "next/server"
import { processCommitGroup } from "@/lib/commit-group"

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event")
  const payload = await req.json()

  if (event === "push") {
    await processCommitGroup({
      repoFullName: payload.repository.full_name,
      commits: payload.commits,
    })
  } else if (event === "pull_request") {
    await processCommitGroup({
      repoFullName: payload.repository.full_name,
      pullNumber: payload.pull_request.number,
    })
  }

  return NextResponse.json({ ok: true })
}
```

#### 5. Agreement Page (replaces `agreements/show.html.erb` — Server Component with Client interactivity)

```tsx
// src/app/agreements/[owner]/[repo]/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { SignatureForm } from "@/components/signature-form"
import { SigningUsersTable } from "@/components/signing-users-table"

export default async function AgreementPage({
  params,
}: {
  params: { owner: string; repo: string }
}) {
  const session = await auth()
  const agreement = await prisma.agreement.findUnique({
    where: {
      userName_repoName: {
        userName: params.owner,
        repoName: params.repo,
      },
    },
    include: {
      signatures: { include: { user: true } },
      agreementFields: { include: { field: true } },
    },
  })

  if (!agreement) return notFound()

  const hasSigned =
    session?.user &&
    agreement.signatures.some((s) => s.user.uid === session.user.uid)
  const isOwner = session?.user?.uid === agreement.userId

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">
        CLA for {params.owner}/{params.repo}
      </h1>

      <article className="prose prose-neutral max-w-none mb-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {agreement.text}
        </ReactMarkdown>
      </article>

      {hasSigned ? (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          You have signed this CLA.
        </div>
      ) : session?.user ? (
        <SignatureForm
          agreementId={agreement.id}
          fields={agreement.agreementFields}
        />
      ) : (
        <SignInPrompt />
      )}

      {isOwner && <SigningUsersTable signatures={agreement.signatures} />}
    </div>
  )
}
```

---

## Comparison

| Concern | Rails (current) | React/Next.js (proposed) |
|---|---|---|
| **Rendering** | Server-only ERB | SSR + Client hydration — fast initial load + rich interactivity |
| **Type safety** | Runtime errors | Compile-time TypeScript across full stack |
| **Markdown preview** | AJAX round-trip to server | Client-side instant preview with `react-markdown` |
| **Forms** | jQuery + Rails UJS | React Hook Form + Zod validation with instant feedback |
| **API** | Implicit Rails conventions | Explicit typed API routes, easy to add a mobile client later |
| **Styling** | Bootstrap (heavy, dated) | Tailwind + shadcn/ui (tree-shaken, modern, accessible) |
| **Database** | ActiveRecord (untyped) | Prisma (auto-generated TypeScript types from schema) |
| **Auth** | Custom session + OmniAuth | Auth.js with JWT/session, CSRF protection built-in |
| **GitHub API** | `github_api` gem | Octokit.js (official, maintained, typed) |
| **Testing** | RSpec + PhantomJS (deprecated) | Vitest + Playwright (modern, fast, maintained) |
| **Deployment** | Heroku only | Vercel, Docker, Heroku, AWS — any Node.js host |
| **Bundle size** | Full Bootstrap + jQuery | Tree-shaken, only ship what's used |

---

## Migration Path

1. **Phase 1:** Set up Next.js project, Prisma schema, auth — get the landing page and OAuth working
2. **Phase 2:** Build agreement CRUD (create, list, show, delete) with API routes
3. **Phase 3:** Implement signature flow with custom fields and Markdown rendering
4. **Phase 4:** Port the webhook handler and commit-status logic (`CommitGroup` → `commit-group.ts`)
5. **Phase 5:** Add CSV export, repo selector, transfer ownership
6. **Phase 6:** Write Playwright E2E tests mirroring the existing acceptance specs
7. **Phase 7:** Migrate the PostgreSQL data and cut over

The data model is clean enough that you can reuse the same PostgreSQL database — Prisma can introspect the existing schema and generate the client from it, so you don't even need a data migration.

---

## Lightweight Database Alternatives

Given CLAHub's relatively simple data model (6 tables, straightforward relations, low-to-moderate write volume), PostgreSQL may be heavier than necessary. Here are lighter options:

### 1. SQLite (via Prisma or Drizzle)

**Best for:** Self-hosted / single-instance deployments

- Zero configuration, no separate server process
- Single file database — trivial to back up (`cp db.sqlite3 backup.sqlite3`)
- Prisma and Drizzle both support it as a first-class provider
- Litestream can stream WAL to S3 for durability

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./clahub.db"
}
```

**Trade-off:** No concurrent writes from multiple processes (fine for a single Next.js server).

### 2. Turso (libSQL — hosted SQLite)

**Best for:** Serverless / edge deployments (Vercel, Cloudflare)

- SQLite-compatible but hosted with HTTP API
- Edge replicas for low-latency reads worldwide
- Generous free tier (9 GB storage, 500 databases)
- Works with Drizzle ORM natively

```typescript
// drizzle.config.ts
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

const client = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
export const db = drizzle(client)
```

**Trade-off:** Vendor-specific, though you can always fall back to plain SQLite.

### 3. Supabase (managed Postgres — but feels lightweight)

**Best for:** Keeping Postgres but removing all ops burden

- Hosted PostgreSQL with a generous free tier
- Built-in auth (could replace NextAuth for GitHub OAuth)
- Auto-generated REST and GraphQL APIs from your schema
- Row-level security for authorization
- Dashboard for data browsing

Not technically a *different* database, but removes the heavyweight feel of self-managing Postgres.

**Trade-off:** Still Postgres under the hood; adds a vendor dependency.

### 4. PlanetScale / Neon (serverless MySQL / Postgres)

**Best for:** Serverless with connection pooling handled for you

| | PlanetScale | Neon |
|---|---|---|
| Engine | MySQL | Postgres |
| Branching | Yes (schema branches) | Yes (database branches) |
| Serverless | Native | Native |
| Free tier | 1 GB | 0.5 GB |
| ORM support | Prisma, Drizzle | Prisma, Drizzle |

Both solve the "serverless can't hold persistent DB connections" problem that raw Postgres has on Vercel.

### 5. JSON file / flat-file (ultra-minimal)

**Best for:** Prototyping or very low-traffic personal instances

- Use `lowdb` (JSON-based) or `unstorage` (key-value with multiple backends)
- Zero dependencies, zero infrastructure
- Could even store data in a Git repo

```typescript
import { JSONFilePreset } from "lowdb/node"

const db = await JSONFilePreset("db.json", {
  users: [], agreements: [], signatures: [],
})
```

**Trade-off:** No relational queries, no concurrent writes, doesn't scale at all.

### Database Recommendation

| Scenario | Pick |
|---|---|
| **Self-hosted on a single VPS** | SQLite (simplest, zero ops) |
| **Deploying to Vercel / edge** | Turso or Neon |
| **Want managed + dashboard + auth** | Supabase |
| **Just prototyping locally** | SQLite or lowdb |

For CLAHub specifically, **SQLite** is the strongest fit — the app has low write concurrency (webhook events + occasional signatures), a small data footprint, and doesn't need multi-region. It drops an entire infrastructure dependency with zero loss in functionality.
