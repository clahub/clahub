import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Scale,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Github,
  MousePointerClick,
  Building2,
  BookCopy,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Why CLA?",
  description:
    "Learn what Contributor License Agreements are, why open-source projects use them, and how CLAHub makes them easy.",
};

export default function WhyClaPage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Why Use a <span className="text-primary-accent">CLA</span>?
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          A Contributor License Agreement (CLA) is a legal document that defines
          the terms under which a contributor grants rights to their
          contributions &mdash; protecting both maintainers and contributors.
        </p>
      </section>

      {/* Benefits grid */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Why Projects Use CLAs
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {[
              {
                icon: Scale,
                title: "Intellectual Property Protection",
                description:
                  "Without a CLA, copyright of each contribution remains with the individual. A CLA ensures the project has the rights it needs to use and distribute all contributions.",
              },
              {
                icon: RefreshCw,
                title: "License Flexibility",
                description:
                  "If a project needs to change its license (e.g. GPLv2 to GPLv3), CLAs mean it can do so without tracking down every past contributor for permission.",
              },
              {
                icon: FileCheck,
                title: "Legal Clarity",
                description:
                  "A CLA provides a clear, documented record that each contributor has agreed to the terms — especially important for regulatory compliance.",
              },
              {
                icon: ShieldCheck,
                title: "Patent Protection",
                description:
                  "Many CLAs include patent grants, protecting the project and its users from patent claims by contributors.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-none">
                <CardContent className="flex gap-4">
                  <item.icon className="text-primary mt-0.5 size-6 shrink-0" />
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who uses CLAs */}
      <section className="container px-4 py-20 text-center md:py-24">
        <h2 className="mb-4 text-3xl font-bold tracking-tight">
          Who Uses CLAs?
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          Many major open-source projects and organizations require CLAs,
          including Apache Software Foundation, Google, Microsoft, Meta, and the
          Cloud Native Computing Foundation. It&apos;s a well-established
          practice in the open-source ecosystem.
        </p>
      </section>

      {/* How CLAHub Helps */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            How CLAHub Helps
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Github,
                title: "Automated GitHub Integration",
                description:
                  "CLAHub checks every pull request and reports CLA status as a GitHub Check.",
              },
              {
                icon: MousePointerClick,
                title: "One-Click Signing",
                description:
                  "Contributors sign the CLA through a simple web interface linked directly from the PR.",
              },
              {
                icon: Building2,
                title: "Organization-Wide Management",
                description:
                  "Manage CLAs across all your repositories from a single dashboard.",
              },
              {
                icon: BookCopy,
                title: "Versioned Agreements",
                description:
                  "Update your CLA terms and automatically request re-signing from contributors.",
              },
              {
                icon: Server,
                title: "Self-Hostable",
                description:
                  "Run CLAHub on your own infrastructure for full control over your data and compliance.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-none">
                <CardContent className="flex gap-4">
                  <item.icon className="text-primary mt-0.5 size-6 shrink-0" />
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container flex flex-col items-center gap-6 px-4 py-20 text-center md:py-24">
        <h2 className="text-3xl font-bold tracking-tight">
          Ready to get started?
        </h2>
        <p className="text-muted-foreground max-w-lg">
          Set up your first CLA in minutes. Free for open-source projects.
        </p>
        <Button size="lg" asChild>
          <Link href="/auth/signin?role=owner">
            Get Started with CLAHub
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </section>
    </>
  );
}
