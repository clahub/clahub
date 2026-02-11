import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl px-4 py-16 md:py-24">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Privacy Policy
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-muted-foreground">Last updated: February 2026</p>

        <h2>1. Information We Collect</h2>

        <h3>GitHub OAuth Data</h3>
        <p>
          When you sign in with GitHub, we receive the following information from
          your GitHub profile:
        </p>
        <ul>
          <li>GitHub username and display name</li>
          <li>Email address (if publicly available)</li>
          <li>Profile avatar URL</li>
          <li>GitHub user ID</li>
        </ul>

        <h3>Repository Data</h3>
        <p>
          When you install the CLAHub GitHub App on your repositories, we access:
        </p>
        <ul>
          <li>Repository name and metadata</li>
          <li>Pull request information (author, status)</li>
        </ul>

        <h3>CLA Signatures</h3>
        <p>
          When contributors sign a CLA, we record:
        </p>
        <ul>
          <li>GitHub username of the signer</li>
          <li>Timestamp of signing</li>
          <li>The agreement version signed</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Authenticate you and provide the Service</li>
          <li>Track CLA signatures for your repositories</li>
          <li>Report CLA status via GitHub Checks on pull requests</li>
          <li>Send service-related notifications (if enabled)</li>
        </ul>

        <h2>3. Cookies</h2>
        <p>
          CLAHub uses essential cookies for session management and
          authentication. We do not use third-party tracking cookies or analytics
          services.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. CLA
          signature records are retained for the lifetime of the agreement, as
          they serve as a legal record of consent. You may request deletion of
          your account and associated data by contacting us.
        </p>

        <h2>5. Data Sharing</h2>
        <p>
          We do not sell your personal information. We may share data only in the
          following circumstances:
        </p>
        <ul>
          <li>
            With repository owners, to verify CLA signatures on their projects
          </li>
          <li>When required by law or legal process</li>
        </ul>

        <h2>6. Security</h2>
        <p>
          We implement reasonable security measures to protect your data,
          including encrypted connections (HTTPS), secure session management, and
          limited access to production systems.
        </p>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Revoke the GitHub App installation at any time</li>
        </ul>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          users of significant changes through the Service.
        </p>
      </div>
    </div>
  );
}
