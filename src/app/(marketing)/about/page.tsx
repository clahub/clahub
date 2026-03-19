import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Github,
  Globe,
  History,
  Code2,
  Users,
  Shield,
  Server,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "CLAHub is an open-source CLA management platform maintained by DamageLabs. Learn about the project's history and mission.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          About <span className="text-primary-accent">CLAHub</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          An open-source platform for managing Contributor License Agreements on
          GitHub. Originally created in 2012, fully rewritten in 2026.
        </p>
      </section>

      {/* Story */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            The Story
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: History,
                title: "2012 — Created",
                description:
                  "CLAHub was originally built as a Ruby on Rails application hosted on Heroku. It provided a simple way to manage CLAs for GitHub projects.",
              },
              {
                icon: Users,
                title: "2016 — Went Dark",
                description:
                  "The hosted instance went down and never came back. 58 issues accumulated. The code sat untouched while the ecosystem moved on.",
              },
              {
                icon: Code2,
                title: "2026 — Rewritten",
                description:
                  "A complete ground-up rewrite with Next.js, TypeScript, and Prisma. Every class of bug from the original was addressed by architecture, not patches.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-0 text-center shadow-none">
                <CardContent className="flex flex-col items-center gap-3">
                  <item.icon className="text-primary size-6" />
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="container px-4 py-20 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Built With
        </h2>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Next.js 16", detail: "App Router + SSR" },
            { label: "TypeScript", detail: "Full-stack type safety" },
            { label: "Prisma 7", detail: "Type-safe ORM" },
            { label: "SQLite", detail: "Zero-ops database" },
            { label: "Auth.js v5", detail: "GitHub OAuth" },
            { label: "Tailwind CSS", detail: "Utility-first styling" },
            { label: "shadcn/ui", detail: "Accessible components" },
            { label: "GitHub App", detail: "Checks API integration" },
          ].map((tech) => (
            <Card key={tech.label} className="border-0 text-center shadow-none">
              <CardContent className="flex flex-col items-center gap-1 py-4">
                <span className="text-sm font-semibold">{tech.label}</span>
                <span className="text-muted-foreground text-xs">{tech.detail}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Maintained by */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Maintained By
          </h2>
          <div className="mx-auto max-w-2xl">
            <Card className="border-0 text-center shadow-none">
              <CardContent className="flex flex-col items-center gap-4">
                <FlaskConical className="text-primary size-10" />
                <h3 className="text-xl font-bold">DamageLabs</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  DamageLabs builds privacy-first software for collectors and
                  maintains open-source developer tools. CLAHub is part of our
                  commitment to keeping useful open-source projects alive.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="https://damagelabs.io" target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 size-4" />
                      damagelabs.io
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="https://github.com/DamageLabs" target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 size-4" />
                      GitHub
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="container px-4 py-20 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Get Involved
        </h2>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: Github,
              title: "Source Code",
              description: "View the code, open issues, submit PRs.",
              href: "https://github.com/DamageLabs/clahub",
              label: "GitHub",
            },
            {
              icon: Shield,
              title: "Documentation",
              description: "Guides for owners and contributors.",
              href: "/docs",
              label: "Read Docs",
            },
            {
              icon: Server,
              title: "Self-Host",
              description: "Run your own instance with Docker.",
              href: "https://github.com/DamageLabs/clahub#docker-self-hosting",
              label: "Get Started",
            },
          ].map((link) => (
            <Card key={link.title} className="border-0 text-center shadow-none">
              <CardContent className="flex flex-col items-center gap-3">
                <link.icon className="text-primary size-6" />
                <h3 className="text-lg font-semibold">{link.title}</h3>
                <p className="text-muted-foreground text-sm">{link.description}</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {link.label}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
