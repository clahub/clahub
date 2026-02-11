# CLAHub Open GitHub Issues Analysis

Analysis of all 58 open issues and their relevance to a modern React/Next.js rewrite.

---

## Category 1: Critical Infrastructure / Platform Stability

### [#174 — CLAHub is down?](https://github.com/clahub/clahub/issues/174)
- **Summary:** The Heroku-hosted app at clahub.com is completely down. Multiple users confirmed the outage.
- **Rewrite relevance:** A Next.js rewrite deployed to Vercel (or similar) completely replaces the fragile Heroku/Rails infrastructure. Modern deployment with health checks, auto-scaling, and zero-downtime deploys eliminates this class of problem.
- **Priority: HIGH** — This is the existential motivation for the rewrite itself.

### [#38 — GitHub webhook sometimes gets an HTTP 504 Gateway Timeout](https://github.com/clahub/clahub/issues/38)
- **Labels:** bug, production
- **Summary:** GitHub webhook events timeout because the single Heroku dyno sleeps (cold start) or processing exceeds Heroku's 30-second limit. The original author suggested backgrounding all webhook processing.
- **Rewrite relevance:** Next.js API routes with async processing solve this. The GitHub App model also provides more reliable delivery with retry mechanisms. Cold-start issues on Vercel are far less severe than Heroku dyno sleeping.
- **Priority: HIGH** — Webhook reliability is core to CLAHub's functionality.

### [#1 — Check open pulls in a background job](https://github.com/clahub/clahub/issues/1)
- **Labels:** enhancement
- **Summary:** When a contributor signs the agreement for a project with open pulls, all open PRs are re-checked synchronously, making the contributor wait. The job should run in the background.
- **Rewrite relevance:** Next.js API routes can trigger async background processing (e.g., Vercel serverless functions, or a queue). This is the oldest open issue and directly relates to [#38](#38--github-webhook-sometimes-gets-an-http-504-gateway-timeout).
- **Priority: HIGH** — Root cause of webhook timeout issues.

### [#130 — Update Tests for RSpec 3](https://github.com/clahub/clahub/issues/130)
- **Summary:** The Rails test suite uses deprecated RSpec 2 syntax. Tests need updating to RSpec 3 conventions.
- **Rewrite relevance:** Entirely obsoleted. The new codebase will use Vitest + Playwright + React Testing Library.
- **Priority: LOW** — Superseded by rewrite.

### [#129 — Transfer and Delete Agreement Tests Intermittently Fail](https://github.com/clahub/clahub/issues/129)
- **Labels:** bug
- **Summary:** Acceptance tests for transferring and deleting agreements are flaky due to race conditions or missing test isolation.
- **Rewrite relevance:** Entirely obsoleted. The rewrite will have a fresh test suite with proper async handling and test isolation.
- **Priority: LOW** — Superseded by rewrite.

---

## Category 2: Core Feature Requests

### [#82 — Enabling CLAHub for whole organizations](https://github.com/clahub/clahub/issues/82)
- **Summary:** Organizations with 100+ repositories find it impractical to set up CLAHub per-repo. Requests org-wide CLA agreements covering all repos in an organization at once.
- **Rewrite relevance:** The new data model should include an `Agreement` entity scoped to either a single repo or an entire org. With the GitHub App model, a single installation can cover all org repos.
- **Priority: HIGH** — Frequently requested; fundamentally changes the data model.

### [#86 — Support private repos](https://github.com/clahub/clahub/issues/86)
- **Labels:** enhancement
- **Summary:** CLAHub only works with public repositories. Users need CLA support for private repos during stealth-mode development.
- **Rewrite relevance:** The GitHub App model naturally supports private repos via installation-level permissions. Straightforward with GitHub Apps.
- **Priority: HIGH** — Major gap in functionality.

### [#157 — API for fetching signatures](https://github.com/clahub/clahub/issues/157)
- **Labels:** question
- **Summary:** Users want to programmatically check whether someone has signed a CLA for integration with bots and webapps. Currently signature data is only accessible via CSV download restricted to the agreement owner.
- **Rewrite relevance:** Next.js API routes are the perfect place for a RESTful API. Include API key generation for agreement owners, public/private endpoints for verification, and JSON responses.
- **Priority: HIGH** — Enables ecosystem integrations, bot support, and automation.

### [#162 — Allow changing CLA form fields after agreement is created](https://github.com/clahub/clahub/issues/162)
- **Summary:** Once an agreement is created, form fields cannot be modified. Users want to add/remove fields without losing existing signature data.
- **Rewrite relevance:** The new data model should store form field definitions with versioning. A React form builder component provides a dynamic UI for editing. Existing signatures retain original field values; new signatures use updated fields.
- **Priority: HIGH** — Common pain point.

### [#103 — Share agreements with org members](https://github.com/clahub/clahub/issues/103)
- **Labels:** enhancement
- **Summary:** Only the agreement creator can see who has signed. Other org members with write access should also be able to view signatories.
- **Rewrite relevance:** Implement role-based access control. Agreement visibility tied to GitHub org membership/permissions. The admin dashboard should show agreements the user has access to, not just ones they created.
- **Priority: HIGH** — Critical for team workflows.

### [#150 — Detect renamed repositories automatically](https://github.com/clahub/clahub/issues/150)
- **Labels:** bug
- **Summary:** When a repo is renamed or transferred to a new org, CLAHub stops working because the agreement is tied to the old owner/repo name.
- **Rewrite relevance:** With the GitHub App model, the app receives `repository.renamed` and `repository.transferred` events. The data model should store **numeric GitHub repository IDs** (stable) as the primary key rather than `owner/repo` strings.
- **Priority: HIGH** — Fundamental data model decision.

### [#170 — Make signatories verifiable when exporting list](https://github.com/clahub/clahub/issues/170)
- **Summary:** When exporting a list of signatories, there should be a way to cryptographically verify authenticity of signatures to prevent tampering.
- **Rewrite relevance:** Store cryptographic hashes (e.g., signed JWT or HMAC) with each signature record. Exports include verification data.
- **Priority: MEDIUM** — Important for legal defensibility.

### [#169 — Printing or PDF](https://github.com/clahub/clahub/issues/169)
- **Summary:** Printing a CLA page or generating a PDF results in terrible formatting. Being a legal document, proper print/PDF output is important.
- **Rewrite relevance:** Use CSS print stylesheets or `react-pdf` / `@react-pdf/renderer` for proper PDF output. A Next.js API route could use Puppeteer for server-side PDF generation.
- **Priority: MEDIUM** — Important for legal use cases.

### [#151 — CCLA Support (Corporate CLA)](https://github.com/clahub/clahub/issues/151)
- **Summary:** Request for Corporate Contributor License Agreement support. CCLAs allow a company to sign on behalf of all its employees.
- **Rewrite relevance:** The data model needs "corporate signatures" — an authorized representative signs once, covering all contributors from that organization. Different form, company-to-users mapping, different verification logic.
- **Priority: MEDIUM** — Important for enterprise users.

### [#107 — Allow team exclusions](https://github.com/clahub/clahub/issues/107)
- **Labels:** enhancement
- **Summary:** Certain team members (core team, expert group) should be exempt from signing the CLA. Need a way to configure excluded GitHub teams or users.
- **Rewrite relevance:** Include an exclusion list (GitHub usernames, team IDs, or org membership) in the data model. The webhook/status-check logic checks exclusions before requiring a signature. React admin UI provides a team/user picker.
- **Priority: MEDIUM** — Important for enterprise adoption.

### [#128 — Email CSV of signers](https://github.com/clahub/clahub/issues/128)
- **Labels:** enhancement
- **Summary:** Request to receive an email with the full CSV list of signers every time someone new signs. Ensures the agreement owner always has a backup.
- **Rewrite relevance:** Include an email notification system (SendGrid, Resend, AWS SES). When a new signature is created, an async job sends an email with the updated CSV.
- **Priority: MEDIUM** — Ties into [#43](#43--notifications).

### [#112 — Import signatures](https://github.com/clahub/clahub/issues/112)
- **Labels:** enhancement, proposal
- **Summary:** CLAHub supports CSV export but not import. Users migrating from another instance have no way to import existing signatures.
- **Rewrite relevance:** Next.js API route for CSV import with a React UI for file upload and column mapping. Imported signatures stored with a "manual" source flag, reconciled when users later authenticate.
- **Priority: MEDIUM** — Important for migration.

### [#46 — Redirect back to GitHub after signing](https://github.com/clahub/clahub/issues/46)
- **Summary:** After signing the CLA, users should be redirected back to the GitHub project or their open PR rather than staying on the CLAHub page.
- **Rewrite relevance:** Track the referrer URL (the GitHub PR that linked them) and redirect after successful signing. Simple UX improvement in the signing page component.
- **Priority: MEDIUM** — Good UX improvement; easy to implement.

### [#43 — Notifications](https://github.com/clahub/clahub/issues/43)
- **Summary:** CLA creators should receive email notifications when a new user signs the CLA.
- **Rewrite relevance:** Email notification system with per-agreement preferences (email on new signature, weekly digest, etc.). Transactional email service via Next.js API routes.
- **Priority: MEDIUM** — Highly requested; pairs with [#128](#128--email-csv-of-signers).

### [#10 — Ability to change CLA text (revisions, versioning)](https://github.com/clahub/clahub/issues/10)
- **Labels:** enhancement
- **Summary:** After creating a CLA, there is no way to update or delete it. CLAs change over time like ToS and privacy policies. Needs an admin interface for revising, deleting, and versioning CLAs, plus the ability to remove signers.
- **Rewrite relevance:** The rewrite should support CLA versioning — each edit creates a new version, existing signatures are tied to the version they signed, and new contributors sign the latest version. React admin dashboard provides the management UI.
- **Priority: HIGH** — Critical for long-term CLA management; relates to [#162](#162--allow-changing-cla-form-fields-after-agreement-is-created) and [#88](#88--updating-an-existing-cla-agreement).

### [#2 — Suggest options for agreement text](https://github.com/clahub/clahub/issues/2)
- **Labels:** enhancement
- **Summary:** Maintainers struggle to choose CLA text. CLAHub should help clarify options (Developer Certificate of Origin, Node.js CLA, Harmony Agreements) and guide maintainers to the best fit for their situation.
- **Rewrite relevance:** The agreement creation flow in React can include a template selector with pre-written CLA texts, plain-language explanations, and a guided wizard. Relates to [#142](#142--integrate-with-harmony-cla-templates).
- **Priority: MEDIUM** — Improves onboarding experience.

### [#3 — Integrate with GitHub new/edit file for CONTRIBUTING text](https://github.com/clahub/clahub/issues/3)
- **Labels:** enhancement
- **Summary:** After creating an agreement, CLAHub suggests linking the CLA from a CONTRIBUTING.md file. It should check if the file exists and provide a direct link to create/edit it on GitHub.
- **Rewrite relevance:** Use the GitHub Contents API to check for CONTRIBUTING.md existence and provide a one-click link to create or edit it. Simple API call in a Server Component.
- **Priority: LOW** — Nice UX touch; easy to implement.

### [#4 — Support two CLA texts for individuals and organizations](https://github.com/clahub/clahub/issues/4)
- **Labels:** enhancement
- **Summary:** Typically there is a CLA for individual contributors and a separate one for corporate contributors. CLAHub should support both.
- **Rewrite relevance:** Directly related to [#151](#151--ccla-support-corporate-cla). The data model should allow multiple agreement types per repo (individual vs. corporate), with the signer choosing which applies.
- **Priority: MEDIUM** — Important for enterprise; pairs with CCLA support.

### [#19 — Support self-hosting and rebranding](https://github.com/clahub/clahub/issues/19)
- **Labels:** proposal
- **Summary:** Organizations may not want to trust a third-party hosted instance for legally-binding agreements. CLAHub should support self-hosting with custom branding (e.g., `clas.apache.org`).
- **Rewrite relevance:** A Next.js app is inherently self-hostable (Docker, Node.js, any cloud). The rewrite should support environment-based branding (logo, colors, title) via configuration. With SQLite as the DB, the entire app is a single deployable unit.
- **Priority: MEDIUM** — Enables enterprise adoption.

### [#24 — Support for platforms other than GitHub](https://github.com/clahub/clahub/issues/24)
- **Summary:** Is there any thought on supporting GitLab or other platforms beyond GitHub?
- **Rewrite relevance:** The rewrite architecture should abstract the Git provider layer (webhooks, OAuth, status checks, repo listing) behind an interface so GitLab/Bitbucket support can be added later without rewriting core logic.
- **Priority: LOW** — Architectural consideration; not a launch requirement.

### [#18 — Ask for maintainer's email address](https://github.com/clahub/clahub/issues/18)
- **Labels:** enhancement
- **Summary:** Some GitHub users don't list their email publicly. CLAHub should ask maintainers for a contact email during signup for communication purposes.
- **Rewrite relevance:** The GitHub OAuth flow can request the `user:email` scope and store the primary verified email. The onboarding flow can prompt for a contact email if none is available.
- **Priority: LOW** — Minor UX improvement.

### [#91 — HTML5 form fields and validation](https://github.com/clahub/clahub/issues/91)
- **Labels:** enhancement
- **Summary:** The signing form should use HTML5 input types (`type="email"`, `required`) for client-side validation.
- **Rewrite relevance:** Automatically addressed by React Hook Form + Zod validation.
- **Priority: LOW** — Default behavior in modern React forms.

### [#87 — Removed webhook problem](https://github.com/clahub/clahub/issues/87)
- **Labels:** enhancement
- **Summary:** If a user manually removes the CLAHub webhook from their GitHub repo, there is no way to re-add it.
- **Rewrite relevance:** GitHub App model eliminates manual webhook management entirely. App installation handles webhooks. A "repair installation" flow can re-establish the connection.
- **Priority: LOW** — Architecturally eliminated by GitHub Apps.

### [#143 — Shield/badge for README](https://github.com/clahub/clahub/issues/143)
- **Summary:** Request for an embeddable badge (like shields.io) showing CLA status or signatory count.
- **Rewrite relevance:** A simple Next.js API route returning an SVG badge. Example: `/api/badge/:owner/:repo`.
- **Priority: LOW** — Nice-to-have; trivial to implement.

### [#32 — Manually add contributor email addresses](https://github.com/clahub/clahub/issues/32)
- **Summary:** Maintainers should be able to manually record CLA signatures obtained through other channels (paper, fax, GPG).
- **Rewrite relevance:** React admin dashboard includes a "Manual Entry" form. Signatures stored with a "manual" source type, treated the same during status checks.
- **Priority: MEDIUM** — Important for mixed signing processes.

### [#31 — Manually revoke CLA signature](https://github.com/clahub/clahub/issues/31)
- **Summary:** Contributors or maintainers should be able to revoke a CLA signature. Open PRs from revoked users should be updated to show CLA failure.
- **Rewrite relevance:** Admin dashboard needs a "revoke" action per signature. Upon revocation, re-evaluate all open PRs from that user and update commit statuses.
- **Priority: MEDIUM** — Important for compliance.

### [#168 — Transfer ownership back to organisation](https://github.com/clahub/clahub/issues/168)
- **Summary:** User accidentally transferred CLA ownership from an org to their personal account. Cannot transfer back because the org does not appear in the target list.
- **Rewrite relevance:** Ownership transfer UI should list all organizations the user belongs to (with admin access) as valid transfer targets.
- **Priority: MEDIUM** — UX improvement for ownership management.

### [#152 — Translate CLAHub](https://github.com/clahub/clahub/issues/152)
- **Labels:** enhancement
- **Summary:** Request to contribute translations (i18n support).
- **Rewrite relevance:** Next.js has built-in i18n routing. Use `next-intl` or similar for UI translations.
- **Priority: LOW** — Nice-to-have for international adoption.

### [#142 — Integrate with Harmony CLA templates](https://github.com/clahub/clahub/issues/142)
- **Summary:** Request to integrate with Project Harmony CLA templates as pre-built agreement starting points.
- **Rewrite relevance:** Agreement creation form could offer template selection with pre-filled Markdown text.
- **Priority: LOW** — Nice-to-have.

### [#88 — Updating an existing CLA agreement](https://github.com/clahub/clahub/issues/88)
- **Labels:** duplicate
- **Summary:** Request to update CLA text after creation. Duplicate of [#162](#162--allow-changing-cla-form-fields-after-agreement-is-created).
- **Priority: LOW** — Duplicate.

### [#37 — ToS Agreement](https://github.com/clahub/clahub/issues/37)
- **Summary:** Request for CLAHub to have its own Terms of Service agreement for users of the platform.
- **Rewrite relevance:** Static page; already exists in the current app. Carry forward to the rewrite.
- **Priority: LOW** — Content/legal task, not technical.

### [#30 — Re-check old commits for added email addresses](https://github.com/clahub/clahub/issues/30)
- **Summary:** If a user adds an email address to their GitHub account after committing, old commits should be re-evaluated.
- **Rewrite relevance:** Implement a "reconciliation" job that periodically re-checks open PRs against current user email lists.
- **Priority: MEDIUM** — Edge case but important for correctness.

---

## Category 3: Bugs Resolved by Rewrite Architecture

### [#163 — "We're sorry but something went wrong" when signing CLA](https://github.com/clahub/clahub/issues/163)
- **Summary:** Submitting the signing form produces a generic 500 error. No useful error details shown. Multiple users reported this.
- **Rewrite relevance:** React frontend with error boundaries, field-level validation, meaningful error messages. API returns structured error responses. Server-side logging with Sentry or similar.
- **Priority: HIGH** — Core functionality broken.

### [#113 — Error on agree](https://github.com/clahub/clahub/issues/113)
- **Labels:** bug, production
- **Summary:** After filling out all CLA fields and pressing "Agree," users get a generic error. No indication of which field failed. 12 comments indicate widespread impact.
- **Rewrite relevance:** Same as #163. Proper form validation (client-side with Zod, server-side with structured responses) and meaningful error messages.
- **Priority: HIGH** — 12 comments; widespread issue.

### [#56 — "Something went wrong" when signing agreement](https://github.com/clahub/clahub/issues/56)
- **Summary:** Another instance of the generic 500 error when signing. 13 comments indicate persistent, widespread problem.
- **Rewrite relevance:** Same root cause as #163 and #113. Proper error handling eliminates this class of bug.
- **Priority: HIGH** — 13 comments; long-standing issue.

### [#161 — Issue with CLAHub when updating the CLA](https://github.com/clahub/clahub/issues/161)
- **Summary:** Updating a CLA produced a generic error. Now the user cannot delete the old CLA or create a new one. Agreement is effectively broken.
- **Rewrite relevance:** Proper transactional updates (if owner transfer fails, roll back), meaningful error messages, admin recovery mechanism.
- **Priority: HIGH** — Data integrity issue.

### [#158 — Owner transfer error; data lost?!](https://github.com/clahub/clahub/issues/158)
- **Summary:** Attempting to transfer agreement ownership caused an error. The agreement appeared to no longer exist, then reappeared with all signatory data lost. **Critical data loss incident.**
- **Rewrite relevance:** Owner transfer must be a database transaction — if any step fails, everything rolls back. Implement soft deletes and audit logging for data recovery.
- **Priority: HIGH** — Data loss is the most critical class of bug.

### [#153 — Build status not set](https://github.com/clahub/clahub/issues/153)
- **Summary:** After a contributor signs the CLA on a PR, the GitHub commit status is not updated. No way to debug.
- **Rewrite relevance:** Use the GitHub Checks API (not the older Statuses API) for more reliable status reporting. Admin dashboard should show webhook delivery logs and status-check results.
- **Priority: HIGH** — Core functionality failure.

### [#146 — Breaks Greenkeeper bot](https://github.com/clahub/clahub/issues/146)
- **Summary:** Automated bots (Greenkeeper, Dependabot) create PRs but cannot sign CLAs, blocking builds. Need bot whitelisting.
- **Rewrite relevance:** Allow configuring bot exclusions by username pattern (e.g., `*[bot]`) or GitHub user IDs. The GitHub API `type` field (`User` vs `Bot`) enables automatic detection.
- **Priority: HIGH** — Blocks modern CI/CD workflows with Dependabot, Renovate, etc.

### [#133 — CLA-Hub integration not working](https://github.com/clahub/clahub/issues/133)
- **Summary:** After signing the CLA, the PR status still shows "CLA not signed." Integration between signing and status checks is broken.
- **Rewrite relevance:** Implement: (1) immediate status re-check after signing, (2) periodic reconciliation of open PRs, (3) a "re-check" button in the UI.
- **Priority: HIGH** — Core functionality failure.

### [#165 — Repository not showing in list for new agreement](https://github.com/clahub/clahub/issues/165)
- **Summary:** A public repo where the user is an org owner does not appear in the repo picker. The repo was moved to a new organization.
- **Rewrite relevance:** With the GitHub App model, the list of available repos comes from the app installation, which is more reliable. React UI should support searching/filtering and handle pagination.
- **Priority: MEDIUM** — Affects onboarding.

### [#67 — Not listing all repos](https://github.com/clahub/clahub/issues/67)
- **Summary:** The "create agreement" page only shows ~229 repos when the user has ~1000. GitHub API pagination is not handled correctly.
- **Rewrite relevance:** Properly paginate the GitHub API. With the GitHub App model, the installation tells us exactly which repos the app has access to.
- **Priority: MEDIUM** — Same root cause as [#165](#165--repository-not-showing-in-list-for-new-agreement) and [#64](#64--organization-repos-not-appearing).

### [#64 — Organization repos not appearing](https://github.com/clahub/clahub/issues/64)
- **Summary:** Org repos do not appear in the agreement creation list despite having admin access. Bug in repo-fetching logic.
- **Rewrite relevance:** Same pagination/filtering bug as #67 and #165. GitHub App model and proper API pagination solve this.
- **Priority: MEDIUM** — Same cluster of bugs.

### [#92 — The CLAHub CLA for CLAHub doesn't exist](https://github.com/clahub/clahub/issues/92)
- **Labels:** bug, production
- **Summary:** The CLA agreement for the CLAHub project itself returns a 404.
- **Rewrite relevance:** Deployment/configuration task. Set up CLAHub's own CLA as a dogfooding exercise.
- **Priority: LOW** — Configuration issue.

### [#55 — Not seeing the "Sign now" link](https://github.com/clahub/clahub/issues/55)
- **Summary:** After setting up CLAHub, PRs go through without requiring CLA signing. Webhook/status-check integration is silently failing.
- **Rewrite relevance:** GitHub App model with proper webhook handling and the Checks API eliminates the fragile webhook setup. Admin UI should show installation status and webhook health.
- **Priority: HIGH** — Users cannot get basic functionality working.

### [#51 — CLAHub not adding pull request footer](https://github.com/clahub/clahub/issues/51)
- **Summary:** CLAHub is not adding expected footer/status to pull requests even though the user signed the CLA.
- **Rewrite relevance:** Use GitHub Checks API (dedicated checks section on PRs) rather than modifying PR comments. More visible, reliable, and doesn't require write access to PR comments.
- **Priority: MEDIUM** — UX improvement via Checks API.

### [#34 — Changing repo owner](https://github.com/clahub/clahub/issues/34)
- **Labels:** bug
- **Summary:** Changing the repo owner/organization breaks the CLAHub integration. Same underlying issue as [#150](#150--detect-renamed-repositories-automatically).
- **Rewrite relevance:** Use numeric GitHub repository IDs as the stable identifier. Handle `repository.transferred` webhook events to update owner/repo name in the database.
- **Priority: HIGH** — Same cluster as #150.

### [#29 — Unverified email addresses](https://github.com/clahub/clahub/issues/29)
- **Labels:** bug
- **Summary:** CLAHub accepts CLA signatures from GitHub users with unverified email addresses. Any user can add any unclaimed email without verifying ownership, undermining CLA verification.
- **Rewrite relevance:** Use the GitHub API's email verification status (the `verified` field on `/user/emails`) and only consider verified emails for CLA matching.
- **Priority: HIGH** — Legal/security vulnerability.

### [#70 — "Corporate Contributor Information" is not optional](https://github.com/clahub/clahub/issues/70)
- **Summary:** Corporate info field is marked required even though it says "fill out IF applicable." Individual contributors cannot submit without it.
- **Rewrite relevance:** React form implements conditional validation — corporate fields only required if user indicates they are signing on behalf of a corporation.
- **Priority: MEDIUM** — UX bug; easy fix in new form.

### [#65 — Authentication failure when running rake](https://github.com/clahub/clahub/issues/65)
- **Summary:** Running the Rails app locally results in an OAuth authentication failure.
- **Rewrite relevance:** Obsoleted. The new app uses GitHub App authentication with proper `.env.local` setup and Next.js environment variable handling.
- **Priority: LOW** — Development environment issue; superseded by rewrite.

### [#154 — Moved repository, things don't work](https://github.com/clahub/clahub/issues/154)
- **Summary:** After moving a repository on GitHub, CLAHub integration stops working.
- **Rewrite relevance:** Same as [#150](#150--detect-renamed-repositories-automatically) and [#34](#34--changing-repo-owner). Use numeric repo IDs + handle transfer/rename events.
- **Priority: HIGH** — Same cluster.

### [#164 — How do I remove CLA Hub from a project](https://github.com/clahub/clahub/issues/164)
- **Summary:** After deleting the CLA and removing the webhook, GitHub still shows the CLAHub status check as failing on PRs. No documentation on how to fully remove CLAHub.
- **Rewrite relevance:** The rewrite should (1) clear pending commit statuses when an agreement is deleted, (2) provide clear documentation on removal, and (3) with the GitHub App model, uninstalling the app cleanly removes all checks.
- **Priority: MEDIUM** — UX/documentation gap.

### [#166 — Add GitHub topics to this repo](https://github.com/clahub/clahub/issues/166)
- **Summary:** Request to add GitHub topics (e.g., `contributor-license-agreement`) to the repo for discoverability.
- **Rewrite relevance:** Not a code issue. Just add topics to the repo settings.
- **Priority: LOW** — Repo metadata task.

---

## Summary Table

| # | Title | Category | Priority |
|---|-------|----------|----------|
| [#174](https://github.com/clahub/clahub/issues/174) | CLAHub is down | Infrastructure | **HIGH** |
| [#38](https://github.com/clahub/clahub/issues/38) | Webhook 504 timeout | Infrastructure | **HIGH** |
| [#1](https://github.com/clahub/clahub/issues/1) | Background job for open pulls | Infrastructure | **HIGH** |
| [#130](https://github.com/clahub/clahub/issues/130) | RSpec 3 update | Infrastructure | LOW |
| [#129](https://github.com/clahub/clahub/issues/129) | Flaky tests | Infrastructure | LOW |
| [#82](https://github.com/clahub/clahub/issues/82) | Org-wide agreements | Feature | **HIGH** |
| [#86](https://github.com/clahub/clahub/issues/86) | Private repos | Feature | **HIGH** |
| [#157](https://github.com/clahub/clahub/issues/157) | API for signatures | Feature | **HIGH** |
| [#162](https://github.com/clahub/clahub/issues/162) | Editable form fields | Feature | **HIGH** |
| [#103](https://github.com/clahub/clahub/issues/103) | Share with org members | Feature | **HIGH** |
| [#150](https://github.com/clahub/clahub/issues/150) | Detect renamed repos | Feature | **HIGH** |
| [#10](https://github.com/clahub/clahub/issues/10) | CLA versioning | Feature | **HIGH** |
| [#170](https://github.com/clahub/clahub/issues/170) | Verifiable exports | Feature | MEDIUM |
| [#169](https://github.com/clahub/clahub/issues/169) | Print/PDF | Feature | MEDIUM |
| [#151](https://github.com/clahub/clahub/issues/151) | CCLA support | Feature | MEDIUM |
| [#107](https://github.com/clahub/clahub/issues/107) | Team exclusions | Feature | MEDIUM |
| [#128](https://github.com/clahub/clahub/issues/128) | Email CSV of signers | Feature | MEDIUM |
| [#112](https://github.com/clahub/clahub/issues/112) | Import signatures | Feature | MEDIUM |
| [#46](https://github.com/clahub/clahub/issues/46) | Redirect after signing | Feature | MEDIUM |
| [#43](https://github.com/clahub/clahub/issues/43) | Notifications | Feature | MEDIUM |
| [#32](https://github.com/clahub/clahub/issues/32) | Manual add contributors | Feature | MEDIUM |
| [#31](https://github.com/clahub/clahub/issues/31) | Revoke CLA signature | Feature | MEDIUM |
| [#168](https://github.com/clahub/clahub/issues/168) | Transfer to org | Feature | MEDIUM |
| [#30](https://github.com/clahub/clahub/issues/30) | Re-check old commits | Feature | MEDIUM |
| [#19](https://github.com/clahub/clahub/issues/19) | Self-hosting & rebranding | Feature | MEDIUM |
| [#4](https://github.com/clahub/clahub/issues/4) | Individual + corporate CLA texts | Feature | MEDIUM |
| [#2](https://github.com/clahub/clahub/issues/2) | Suggest agreement text options | Feature | MEDIUM |
| [#143](https://github.com/clahub/clahub/issues/143) | Shield/badge | Feature | LOW |
| [#91](https://github.com/clahub/clahub/issues/91) | HTML5 form fields | Feature | LOW |
| [#87](https://github.com/clahub/clahub/issues/87) | Removed webhook | Feature | LOW |
| [#152](https://github.com/clahub/clahub/issues/152) | i18n / translations | Feature | LOW |
| [#142](https://github.com/clahub/clahub/issues/142) | Harmony CLA templates | Feature | LOW |
| [#37](https://github.com/clahub/clahub/issues/37) | ToS agreement | Feature | LOW |
| [#24](https://github.com/clahub/clahub/issues/24) | Support non-GitHub platforms | Feature | LOW |
| [#18](https://github.com/clahub/clahub/issues/18) | Ask for maintainer email | Feature | LOW |
| [#3](https://github.com/clahub/clahub/issues/3) | Integrate with CONTRIBUTING file | Feature | LOW |
| [#88](https://github.com/clahub/clahub/issues/88) | Update existing CLA | Feature | LOW (dup of #162) |
| [#163](https://github.com/clahub/clahub/issues/163) | Error signing CLA | Bug | **HIGH** |
| [#113](https://github.com/clahub/clahub/issues/113) | Error on agree | Bug | **HIGH** |
| [#56](https://github.com/clahub/clahub/issues/56) | Something went wrong | Bug | **HIGH** |
| [#158](https://github.com/clahub/clahub/issues/158) | Owner transfer data loss | Bug | **HIGH** |
| [#161](https://github.com/clahub/clahub/issues/161) | CLA update error | Bug | **HIGH** |
| [#153](https://github.com/clahub/clahub/issues/153) | Build status not set | Bug | **HIGH** |
| [#133](https://github.com/clahub/clahub/issues/133) | Integration not working | Bug | **HIGH** |
| [#146](https://github.com/clahub/clahub/issues/146) | Breaks bots | Bug | **HIGH** |
| [#55](https://github.com/clahub/clahub/issues/55) | No sign-now link | Bug | **HIGH** |
| [#29](https://github.com/clahub/clahub/issues/29) | Unverified emails | Bug | **HIGH** |
| [#34](https://github.com/clahub/clahub/issues/34) | Changing repo owner | Bug | **HIGH** |
| [#154](https://github.com/clahub/clahub/issues/154) | Moved repo breaks | Bug | **HIGH** |
| [#165](https://github.com/clahub/clahub/issues/165) | Repo not in list | Bug | MEDIUM |
| [#67](https://github.com/clahub/clahub/issues/67) | Not listing all repos | Bug | MEDIUM |
| [#64](https://github.com/clahub/clahub/issues/64) | Org repos missing | Bug | MEDIUM |
| [#70](https://github.com/clahub/clahub/issues/70) | Corporate info not optional | Bug | MEDIUM |
| [#51](https://github.com/clahub/clahub/issues/51) | No PR footer | Bug | MEDIUM |
| [#164](https://github.com/clahub/clahub/issues/164) | How to remove CLAHub | Bug | MEDIUM |
| [#92](https://github.com/clahub/clahub/issues/92) | CLAHub CLA missing | Bug | LOW |
| [#65](https://github.com/clahub/clahub/issues/65) | Auth failure on rake | Bug | LOW |
| [#166](https://github.com/clahub/clahub/issues/166) | Add GitHub topics | Meta | LOW |

---

## Key Architectural Takeaways for the Rewrite

1. **Use GitHub Apps, not OAuth webhooks.** This single decision resolves [#38](https://github.com/clahub/clahub/issues/38), [#55](https://github.com/clahub/clahub/issues/55), [#86](https://github.com/clahub/clahub/issues/86), [#87](https://github.com/clahub/clahub/issues/87), [#133](https://github.com/clahub/clahub/issues/133), [#150](https://github.com/clahub/clahub/issues/150), [#153](https://github.com/clahub/clahub/issues/153), [#165](https://github.com/clahub/clahub/issues/165), and partially [#82](https://github.com/clahub/clahub/issues/82). GitHub Apps provide installation-level webhook delivery, automatic retry, private repo access, and reliable repository event handling.

2. **Use numeric GitHub repository IDs as primary keys** (not `owner/repo` strings). This resolves [#34](https://github.com/clahub/clahub/issues/34), [#150](https://github.com/clahub/clahub/issues/150), [#154](https://github.com/clahub/clahub/issues/154), and [#168](https://github.com/clahub/clahub/issues/168) — repos that are renamed or transferred maintain their agreement association.

3. **Implement proper error handling and form validation.** The single most common bug class ([#56](https://github.com/clahub/clahub/issues/56), [#113](https://github.com/clahub/clahub/issues/113), [#163](https://github.com/clahub/clahub/issues/163)) is the generic "something went wrong" error with no details. The React frontend needs field-level validation, error boundaries, and user-facing error messages. The API needs structured error responses.

4. **Implement transactional data operations with audit logging.** Issues [#158](https://github.com/clahub/clahub/issues/158) and [#161](https://github.com/clahub/clahub/issues/161) show that ownership transfers and CLA updates can corrupt or lose data. All mutations need database transactions and an audit trail for recovery.

5. **Design the data model for org-scope from day one.** Issues [#82](https://github.com/clahub/clahub/issues/82), [#103](https://github.com/clahub/clahub/issues/103), and [#107](https://github.com/clahub/clahub/issues/107) all require agreements that can be org-scoped, with role-based access for org members and exclusion lists for teams/bots.

6. **Use the GitHub Checks API** (not the older Statuses API or PR comment footers). This resolves [#51](https://github.com/clahub/clahub/issues/51), [#55](https://github.com/clahub/clahub/issues/55), and [#153](https://github.com/clahub/clahub/issues/153) with a modern, reliable mechanism for showing CLA status on PRs.

7. **Build a REST API from the start.** Issue [#157](https://github.com/clahub/clahub/issues/157) shows demand for programmatic access. Designing the API first (Next.js API routes) makes the frontend a consumer of the same API that external tools use.

8. **Plan for email notifications and data export.** Issues [#43](https://github.com/clahub/clahub/issues/43), [#128](https://github.com/clahub/clahub/issues/128), and [#170](https://github.com/clahub/clahub/issues/170) show users need notifications and verifiable data exports. Integrate a transactional email service and design export formats with verification from the beginning.
