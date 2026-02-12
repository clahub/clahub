import type { Metadata } from "next";
import {
  Github,
  GitPullRequest,
  Pen,
  ShieldCheck,
  Cookie,
  Clock,
  Users,
  Lock,
  UserCog,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Privacy <span className="text-primary-accent">Policy</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          We collect only what we need to run CLAHub and never sell your data.
        </p>
        <p className="text-muted-foreground text-sm">
          Last updated: February 2026
        </p>
      </section>

      {/* What we collect */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            1. Information We Collect
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {[
              {
                icon: Github,
                title: "GitHub OAuth Data",
                items: [
                  "GitHub username and display name",
                  "Email address (if publicly available)",
                  "Profile avatar URL",
                  "GitHub user ID",
                ],
              },
              {
                icon: GitPullRequest,
                title: "Repository Data",
                items: [
                  "Repository name and metadata",
                  "Pull request information (author, status)",
                ],
              },
              {
                icon: Pen,
                title: "CLA Signatures",
                items: [
                  "GitHub username of the signer",
                  "Timestamp of signing",
                  "The agreement version signed",
                ],
              },
            ].map((category) => (
              <Card key={category.title} className="border-0 shadow-none">
                <CardContent>
                  <div className="mb-3 flex items-center gap-3">
                    <category.icon className="text-primary size-6 shrink-0" />
                    <h3 className="font-semibold">{category.title}</h3>
                  </div>
                  <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                    {category.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How we use it + policies */}
      <section className="container px-4 py-20 md:py-24">
        <div className="mx-auto grid max-w-4xl gap-6">
          {[
            {
              icon: ShieldCheck,
              title: "2. How We Use Your Information",
              list: [
                "Authenticate you and provide the Service",
                "Track CLA signatures for your repositories",
                "Report CLA status via GitHub Checks on pull requests",
                "Send service-related notifications (if enabled)",
              ],
            },
            {
              icon: Cookie,
              title: "3. Cookies",
              content:
                "CLAHub uses essential cookies for session management and authentication. We do not use third-party tracking cookies or analytics services.",
            },
            {
              icon: Clock,
              title: "4. Data Retention",
              content:
                "We retain your data for as long as your account is active. CLA signature records are retained for the lifetime of the agreement, as they serve as a legal record of consent. You may request deletion of your account and associated data by contacting us.",
            },
            {
              icon: Users,
              title: "5. Data Sharing",
              content:
                "We do not sell your personal information. We may share data only with repository owners to verify CLA signatures on their projects, or when required by law or legal process.",
            },
            {
              icon: Lock,
              title: "6. Security",
              content:
                "We implement reasonable security measures to protect your data, including encrypted connections (HTTPS), secure session management, and limited access to production systems.",
            },
            {
              icon: UserCog,
              title: "7. Your Rights",
              list: [
                "Access the personal data we hold about you",
                "Request correction of inaccurate data",
                "Request deletion of your data",
                "Revoke the GitHub App installation at any time",
              ],
            },
            {
              icon: RefreshCw,
              title: "8. Changes to This Policy",
              content:
                "We may update this Privacy Policy from time to time. We will notify users of significant changes through the Service.",
            },
          ].map((s) => (
            <Card key={s.title} className="border-0 shadow-none">
              <CardContent className="flex gap-4">
                <s.icon className="text-primary mt-0.5 size-6 shrink-0" />
                <div>
                  <h2 className="mb-1 text-lg font-semibold">{s.title}</h2>
                  {s.content && (
                    <p className="text-muted-foreground text-sm">{s.content}</p>
                  )}
                  {s.list && (
                    <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
                      {s.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
