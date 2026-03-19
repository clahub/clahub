# CLAHub Owner How-To Guide

A step-by-step walkthrough for project owners. This guide takes you from zero to a fully configured CLA in about 10 minutes.

---

## Prerequisites

Before you start, you'll need:

- A GitHub account that owns (or has admin access to) the repos you want to protect
- The CLAHub GitHub App installed on your account or organization ([install here](https://github.com/apps/clahub))

---

## Step 1: Sign In as an Owner

1. Go to [cla-hub.io](https://cla-hub.io)
2. Click **"Sign in as Owner"** (not "Sign in as Contributor")
3. Authorize CLAHub with GitHub

> **Why two sign-in options?** The Owner flow requests elevated GitHub permissions (repo status, webhook access, org read) so CLAHub can create check runs on your PRs. The Contributor flow uses minimal permissions. You need Owner access to create and manage agreements.

After signing in, you'll land on your **Dashboard** — a list of all your CLA agreements.

---

## Step 2: Install the GitHub App

If you haven't already installed the CLAHub GitHub App:

1. Go to [github.com/apps/clahub](https://github.com/apps/clahub)
2. Click **Install**
3. Select your personal account or your organization
4. Choose **All repositories** or select specific repos
5. Click **Install**

> **Important:** The GitHub App installation is what allows CLAHub to create check runs on PRs and receive webhook events. Without it, CLAHub can't monitor your repos.

---

## Step 3: Create Your First Agreement

### For a Single Repository

1. Click **"New Agreement"** on your dashboard
2. Under **Scope**, select **Repository**
3. In the dropdown, find your repo (e.g., `my-org/my-project`)
4. Choose a template:
   - **Apache ICLA** — standard individual contributor license agreement
   - **DCO** — Developer Certificate of Origin (lighter weight)
   - **Custom** — write your own
5. Edit the CLA text in the Markdown editor (live preview on the right)
6. Click **"Create Agreement"**

### For an Entire Organization

1. Click **"New Agreement"**
2. Under **Scope**, select **Organization**
3. Select your GitHub org from the dropdown
4. Choose a template and edit the text
5. Click **"Create Agreement"**

One signature covers every repo in the org. Contributors don't need to sign again when they contribute to a different repo in the same org.

---

## Step 4: Configure Custom Fields (Optional)

Want contributors to provide additional information when signing? Add custom fields:

1. On the agreement edit page, scroll to **Custom Fields**
2. Click **"Add Field"**
3. Configure the field:
   - **Label** — what the contributor sees (e.g., "Company Name")
   - **Type** — text, email, URL, checkbox, or date
   - **Required** — whether the field must be filled out
   - **Description** — help text shown below the field
4. Drag to reorder fields
5. Save

**Common field setups:**

| Use Case | Fields |
|----------|--------|
| Basic | Full Legal Name (text, required) |
| Corporate | Full Legal Name, Company Name, Company Email (all required) |
| Compliance | Full Legal Name, Employer (text), Mailing Address (text) |

---

## Step 5: Set Up Exclusions

Not everyone should need to sign. Configure exclusions to skip bots, core team, and trusted users:

### Auto-Detect Bots

1. On the agreement edit page, find the **Exclusions** section
2. Click **"Enable bot auto-detection"**
3. This automatically excludes any GitHub account ending in `[bot]` — Dependabot, Renovate, GitHub Actions, etc.

### Exclude Individual Users

1. In the Exclusions section, select **"User"**
2. Enter the GitHub username
3. Click **"Add"**

Use this for core team members, co-maintainers, or anyone who shouldn't need to sign.

### Exclude a GitHub Team

1. In the Exclusions section, select **"Team"**
2. Search for and select the team (e.g., `@my-org/core-team`)
3. Click **"Add"**

All current members of that team are excluded. If someone joins the team later, they're automatically excluded too.

---

## Step 6: Enable Email Notifications (Optional)

Get an email every time someone signs your CLA:

1. On the agreement edit page, find **Notifications**
2. Toggle **"Notify on new signatures"** on
3. Notifications go to the email on your GitHub account

Each notification includes the signer's GitHub username and which agreement they signed.

---

## Step 7: Add a Badge to Your README

Let people know your project uses a CLA:

**For a repo agreement:**
```markdown
[![CLA](https://cla-hub.io/api/badge/YOUR-ORG/YOUR-REPO)](https://cla-hub.io/agreements/YOUR-ORG/YOUR-REPO)
```

**For an org-wide agreement:**
```markdown
[![CLA](https://cla-hub.io/api/badge/YOUR-ORG)](https://cla-hub.io/agreements/YOUR-ORG)
```

The badge dynamically shows the CLA status.

---

## Step 8: Generate a CONTRIBUTING.md Snippet

CLAHub can generate a ready-to-paste section for your CONTRIBUTING.md:

1. On the agreement edit page, find **CONTRIBUTING.md**
2. Copy the generated Markdown
3. Paste into your project's `CONTRIBUTING.md`

The snippet includes instructions for contributors and the CLA badge.

---

## What Happens Next

Once your agreement is created:

1. A contributor opens a PR on your repo
2. CLAHub receives a webhook from GitHub
3. CLAHub checks all commit authors against your signed signatures list
4. If everyone has signed → ✅ **"All authors have signed the CLA"**
5. If someone hasn't signed → ❌ **"1 author(s) need to sign the CLA"** with a link
6. The contributor clicks the link, signs, and the check updates automatically

You don't need to do anything — it's fully automated.

---

## Day-to-Day Management

### Viewing Who Has Signed

Go to your agreement page. You'll see:

- **Signature count** and list of all signatories
- Each signature shows: GitHub username, sign date, type (individual/corporate), version signed, source (online/manual/import)
- Click on any signature to see custom field values

### Adding Signatures Manually

For contributors who signed via email, paper, or another system:

1. Go to your agreement's edit page
2. In the **Signature Manager**, enter the GitHub username or email
3. Click **"Add Signature"**

### Bulk Import via CSV

Have a list of contributors who already signed?

1. Prepare a CSV: `github_username` column (or `email`)
2. Go to your agreement's edit page
3. Upload the CSV in the Import section
4. **Preview** — CLAHub shows what will be imported, duplicates, and errors
5. **Confirm** the import

### Revoking a Signature

If a contributor's authorization is no longer valid:

1. Find the signature in the signatories list
2. Click **Revoke**
3. Confirm

What happens:
- The signature is marked as revoked (not deleted — it's in the audit log)
- CLAHub automatically re-checks all open PRs from that contributor
- Their PRs will switch from ✅ to ❌
- Revoked signatures can be restored later

### Updating Your CLA Text

1. Go to your agreement's edit page
2. Edit the Markdown text
3. Optionally add a **changelog entry** explaining what changed
4. Save

This creates a new version. Existing signatures stay linked to the version they signed. Whether you require re-signing after a version bump is a policy decision — CLAHub tracks which version each person signed.

### Transferring Ownership

Moving the project to a new maintainer?

1. Go to your agreement's edit page
2. In **Transfer Ownership**, enter the new owner's GitHub username
3. They must already have a CLAHub account (signed in as Owner at least once)
4. Confirm the transfer

Everything transfers: signatures, exclusions, versions, audit history.

---

## Setting Up Corporate CLAs

For organizations where a company signs on behalf of all its employees:

### How It Works

1. A company representative signs the CLA as a **Corporate** signature
2. They provide their company name and email domain (e.g., `acme.com`)
3. Any contributor whose GitHub email matches `@acme.com` is automatically covered
4. Individual employees don't need to sign separately

### Setting It Up

Corporate CLA support is automatic — when a contributor signs, they choose between Individual and Corporate on the signing page. No special configuration needed on the owner side.

### What You See

In your signatories list, corporate signatures show:
- **Type:** Corporate
- **Company:** Acme Inc.
- **Domain:** acme.com
- **Signed by:** The representative's GitHub username

Contributors covered by a corporate signature show as "Corporate-covered" in PR check results.

---

## API Keys

For CI/CD integration or programmatic access:

1. Go to **Settings → API Keys**
2. Click **"Generate New Key"**
3. Give it a name (e.g., "CI Pipeline")
4. Copy the key immediately — it won't be shown again
5. Keys are prefixed with `clahub_` for easy identification

### Example API Usage

```bash
# Check if a user has signed
curl -H "Authorization: Bearer clahub_xxxx" \
  https://cla-hub.io/api/v1/agreements/my-org/my-repo/check/username

# List all signatures
curl -H "Authorization: Bearer clahub_xxxx" \
  https://cla-hub.io/api/v1/agreements/my-org/my-repo/signatures

# Export signatures as CSV
curl -H "Authorization: Bearer clahub_xxxx" \
  https://cla-hub.io/api/v1/agreements/my-org/my-repo/export/csv > signatures.csv
```

### Rate Limits

- **Read operations:** 100 requests/minute
- **Write operations:** 60 requests/minute
- Check `X-RateLimit-Remaining` header to avoid hitting limits

---

## Reviewing the Audit Log

Every action is logged. View the audit log from your agreement's edit page:

| Action | What's Logged |
|--------|--------------|
| Agreement created/updated/deleted | Before and after state |
| Signature signed | Version signed, fields provided, IP |
| Signature revoked/restored | Who revoked, when |
| Exclusion added/removed | Type, target |
| Ownership transferred | From/to |
| Manual signature added | Who added it |
| CSV import | Count imported |

The audit log is immutable — entries can't be edited or deleted.

---

## Tips

1. **Start with the DCO** if you're unsure which template to use. It's the lightest-weight option and what the Linux kernel uses.

2. **Use org-wide CLAs** instead of per-repo if you have more than 2-3 repos. Less management, same coverage.

3. **Always enable bot auto-detection.** Dependabot PRs shouldn't need CLA signatures.

4. **Add the badge to your README.** It tells potential contributors what to expect before they start coding.

5. **Don't require re-signing for minor CLA text changes.** Only bump versions for material legal changes.

6. **Export signatures periodically** as a backup. The CSV export takes 2 seconds and gives you an offline record.

---

*Questions? Open an issue at [github.com/DamageLabs/clahub](https://github.com/DamageLabs/clahub/issues) or reach out via [damagelabs.io/contact](https://damagelabs.io/contact).*
