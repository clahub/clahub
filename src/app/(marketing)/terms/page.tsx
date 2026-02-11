import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl px-4 py-16 md:py-24">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Terms of Service
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-muted-foreground">Last updated: February 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using CLAHub (&ldquo;the Service&rdquo;), you agree to
          be bound by these Terms of Service. If you do not agree to these terms,
          do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          CLAHub is a web-based platform that helps open-source project
          maintainers manage Contributor License Agreements (CLAs). The Service
          integrates with GitHub to automate CLA tracking and verification on
          pull requests.
        </p>

        <h2>3. GitHub Account</h2>
        <p>
          You must have a valid GitHub account to use the Service. By
          authenticating with GitHub, you authorize CLAHub to access your public
          profile information and, for repository owners, to install the CLAHub
          GitHub App on selected repositories.
        </p>

        <h2>4. User Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information when creating agreements</li>
          <li>Use the Service in compliance with all applicable laws</li>
          <li>Not attempt to interfere with the Service&apos;s operation</li>
          <li>
            Not use the Service for any unlawful or fraudulent purpose
          </li>
        </ul>

        <h2>5. Contributor License Agreements</h2>
        <p>
          CLAHub facilitates the creation and signing of CLAs between project
          maintainers and contributors. CLAHub is not a party to any CLA created
          through the Service. The legal relationship created by a CLA is solely
          between the project maintainer and the contributor.
        </p>

        <h2>6. Data and Content</h2>
        <p>
          You retain ownership of any content you submit through the Service,
          including CLA text and signatures. By using the Service, you grant
          CLAHub a limited license to store and display this content as necessary
          to provide the Service.
        </p>

        <h2>7. Availability and Modifications</h2>
        <p>
          We reserve the right to modify, suspend, or discontinue the Service at
          any time. We will make reasonable efforts to notify users of significant
          changes.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind.
          CLAHub shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of the Service.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We may update these Terms of Service from time to time. Continued use
          of the Service after changes constitutes acceptance of the revised
          terms.
        </p>
      </div>
    </div>
  );
}
