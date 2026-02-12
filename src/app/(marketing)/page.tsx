import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, GitPullRequest, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-8 px-4 py-24 text-center md:py-32">
        <Image src="/cla-logo.png" alt="CLAHub" width={64} height={64} priority />
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Contributor License Agreements,{" "}
          <span className="text-primary-accent">simplified</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg md:text-xl">
          CLAHub automates CLA management for your GitHub projects.
          Install the GitHub App, define your agreement, and let
          contributors sign with a single click.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth/signin?role=owner">
              Get Started
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/signin?role=contributor">Sign a CLA</Link>
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            How It Works
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Install the GitHub App",
                description:
                  "Add CLAHub to your repositories. It takes less than a minute.",
              },
              {
                step: "2",
                title: "Create Your CLA",
                description:
                  "Define your contributor license agreement with our editor or upload your own.",
              },
              {
                step: "3",
                title: "Contributors Sign",
                description:
                  "Pull requests are automatically checked. Contributors sign once and they're covered.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-3 text-center">
                <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 py-20 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Why CLAHub?
        </h2>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {[
            {
              icon: GitPullRequest,
              title: "GitHub Checks Integration",
              description:
                "Automatic status checks on every pull request. No manual tracking required.",
            },
            {
              icon: Building2,
              title: "Organization Support",
              description:
                "Manage CLAs across all repositories in your GitHub organization from one place.",
            },
            {
              icon: Shield,
              title: "Self-Hostable",
              description:
                "Run CLAHub on your own infrastructure for complete control over your data.",
            },
            {
              icon: CheckCircle,
              title: "Versioned Agreements",
              description:
                "Track agreement versions and re-request signatures when terms change.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="border-0 shadow-none">
              <CardContent className="flex gap-4">
                <feature.icon className="text-primary mt-0.5 size-6 shrink-0" />
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 border-t">
        <div className="container flex flex-col items-center gap-6 px-4 py-20 text-center md:py-24">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Set up your first CLA in minutes. Free for open-source projects.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signin?role=owner">
              Create Your CLA
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
