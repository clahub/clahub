# CLAHub Contributor How-To Guide

A quick guide for open source contributors who need to sign a CLA.

---

## What Is a CLA?

A Contributor License Agreement (CLA) is a legal document that defines the terms under which you contribute code to a project. It typically confirms that:

- You have the right to submit the code
- You grant the project a license to use your contribution
- You're not violating any employer agreements

Most CLAs are short and straightforward. Signing one takes about 30 seconds.

---

## How to Sign

### Step 1: Open a Pull Request

Submit your PR as you normally would. If the project uses CLAHub, you'll see a check appear on your PR:

- ❌ **CLAHub** — "1 author(s) need to sign the CLA"

### Step 2: Click the Details Link

Click **"Details"** on the CLAHub check. This takes you to the project's CLA page on [cla-hub.io](https://cla-hub.io).

### Step 3: Sign In

Click **"Sign in as Contributor"**. This uses GitHub OAuth with **minimal permissions** — CLAHub only requests access to your public profile. It cannot:

- Read your private repos
- Push code on your behalf
- Access your email beyond what's already public
- See your organization memberships

### Step 4: Read the CLA

The full CLA text is displayed in Markdown. Read it. Common types:

| Type | What It Says |
|------|-------------|
| **Apache ICLA** | You grant copyright and patent licenses for your contributions |
| **DCO** | You certify you have the right to submit the code |
| **Custom** | Varies by project — read carefully |

### Step 5: Fill in Required Fields

Some projects ask for additional information (full name, company, email). Fill in whatever's required.

### Step 6: Click "I Agree and Sign"

That's it. Your signature is recorded.

---

## What Happens After Signing

1. **Your PR updates automatically.** Within seconds, the CLAHub check changes from ❌ to ✅. No need to re-push, close/reopen, or ask a maintainer to do anything.

2. **All your open PRs update.** If you have multiple open PRs on the same project (or org), they all get green checks.

3. **Future PRs are covered.** You don't need to sign again for the same project. Your signature persists across all future contributions.

4. **Org-wide CLAs cover all repos.** If you signed for an organization, your signature covers every repo in that org — not just the one you contributed to.

---

## Corporate CLAs

If your company has a corporate CLA with the project:

- You may already be covered without signing individually
- CLAHub checks your GitHub email domain against corporate signatures
- If your email matches (e.g., `you@company.com` and the company signed for `company.com`), you're automatically cleared

If you're not sure whether your company has signed, check with your legal or engineering team.

---

## FAQ

### Do I need to create an account?

No. Signing in with GitHub is your account. There's nothing extra to register.

### What permissions does CLAHub request?

When signing in as a Contributor, CLAHub requests only your **public GitHub profile**. It cannot access your repos, code, or private data.

### Can I sign for multiple projects?

Yes. Each project has its own CLA. You sign each one separately. If a project uses an org-wide CLA, one signature covers all their repos.

### What if I already signed but my PR still shows ❌?

This can happen if:

- **You committed with a different email** than the one on your GitHub account. CLAHub matches by GitHub user ID, email, and username — but the commit email must be linked to your GitHub account.
- **The maintainer revoked your signature.** Contact the project maintainer.
- **You're a new contributor to a different repo** in the same org that doesn't use the org-wide CLA. You may need to sign a separate agreement.

Fix: Go to [GitHub email settings](https://github.com/settings/emails) and make sure the email you commit with is added to your account.

### Can I see what I've signed?

Yes. Go to the project's CLA page (the same link from your PR check) — if you've signed, you'll see a confirmation banner with the date and version you signed.

### Can I unsign / withdraw my signature?

You can't revoke your own signature. Contact the project maintainer if you need to withdraw. Note that revoking a signature will cause your open PRs to fail the CLA check.

### Is my data stored?

CLAHub stores:
- Your GitHub username, ID, and public email
- Your signature (date, IP address, version signed)
- Any custom field values you provided (name, company, etc.)

CLAHub does **not** store your GitHub password or OAuth token beyond the session.

---

## Quick Reference

| Action | How |
|--------|-----|
| Sign a CLA | Click "Details" on the PR check → Sign in → Read → Sign |
| Check if you've signed | Visit the project's CLA page — look for the green banner |
| Fix a failed check | Make sure your commit email is linked to your GitHub account |
| Sign for a different project | Each project has its own CLA — sign separately |

---

*CLAHub is maintained by [DamageLabs](https://damagelabs.io). Questions? Open an issue at [github.com/DamageLabs/clahub](https://github.com/DamageLabs/clahub/issues).*
