import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Why CLA?",
  description:
    "Learn what Contributor License Agreements are, why open-source projects use them, and how CLAHub makes them easy.",
};

export default function WhyClaPage() {
  return (
    <div className="container max-w-3xl px-4 py-16 md:py-24">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Why Use a Contributor License Agreement?
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>What is a CLA?</h2>
        <p>
          A Contributor License Agreement (CLA) is a legal document that defines
          the terms under which a contributor grants rights to their
          contributions. It clarifies the intellectual property ownership of code
          submitted to a project and protects both the project maintainers and
          contributors.
        </p>

        <h2>Why Do Projects Use CLAs?</h2>

        <h3>Intellectual Property Protection</h3>
        <p>
          Without a CLA, the copyright of each contribution remains with the
          individual contributor. This can create legal uncertainty if the project
          needs to relicense, enforce its license, or defend against patent
          claims. A CLA ensures the project has the necessary rights to use and
          distribute all contributions.
        </p>

        <h3>License Flexibility</h3>
        <p>
          If a project ever needs to change its license (for example, from
          GPLv2 to GPLv3), having CLAs in place means the project can do so
          without needing to track down and get permission from every past
          contributor.
        </p>

        <h3>Legal Clarity</h3>
        <p>
          A CLA provides a clear, documented record that each contributor has
          agreed to the terms of contribution. This is especially important for
          organizations that need to comply with legal or regulatory requirements.
        </p>

        <h3>Patent Protection</h3>
        <p>
          Many CLAs include patent grants, which protect the project and its
          users from patent claims by contributors. This adds an important layer
          of legal safety for everyone involved.
        </p>

        <h2>Who Uses CLAs?</h2>
        <p>
          Many major open-source projects and organizations require CLAs,
          including Apache Software Foundation, Google, Microsoft, Meta,
          and the Cloud Native Computing Foundation. It&apos;s a well-established
          practice in the open-source ecosystem.
        </p>

        <h2>How CLAHub Helps</h2>
        <p>
          CLAHub makes CLA management effortless:
        </p>
        <ul>
          <li>
            <strong>Automated GitHub integration</strong> &mdash; CLAHub checks
            every pull request and reports CLA status as a GitHub Check.
          </li>
          <li>
            <strong>One-click signing</strong> &mdash; Contributors sign the CLA
            through a simple web interface linked directly from the PR.
          </li>
          <li>
            <strong>Organization-wide management</strong> &mdash; Manage CLAs
            across all your repositories from a single dashboard.
          </li>
          <li>
            <strong>Versioned agreements</strong> &mdash; Update your CLA terms
            and automatically request re-signing from contributors.
          </li>
          <li>
            <strong>Self-hostable</strong> &mdash; Run CLAHub on your own
            infrastructure for full control over your data and compliance.
          </li>
        </ul>
      </div>

      <div className="mt-12 flex justify-center">
        <Button size="lg" asChild>
          <Link href="/auth/signin?role=owner">
            Get Started with CLAHub
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
