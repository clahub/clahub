import type { Metadata } from "next";
import {
  HandshakeIcon,
  Info,
  UserCheck,
  ListChecks,
  FileText,
  Database,
  ServerCog,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const sections = [
  {
    icon: HandshakeIcon,
    title: "1. Acceptance of Terms",
    content:
      'By accessing or using CLAHub (\u201cthe Service\u201d), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.',
  },
  {
    icon: Info,
    title: "2. Description of Service",
    content:
      "CLAHub is a web-based platform that helps open-source project maintainers manage Contributor License Agreements (CLAs). The Service integrates with GitHub to automate CLA tracking and verification on pull requests.",
  },
  {
    icon: UserCheck,
    title: "3. GitHub Account",
    content:
      "You must have a valid GitHub account to use the Service. By authenticating with GitHub, you authorize CLAHub to access your public profile information and, for repository owners, to install the CLAHub GitHub App on selected repositories.",
  },
  {
    icon: ListChecks,
    title: "4. User Responsibilities",
    list: [
      "Provide accurate information when creating agreements",
      "Use the Service in compliance with all applicable laws",
      "Not attempt to interfere with the Service\u2019s operation",
      "Not use the Service for any unlawful or fraudulent purpose",
    ],
  },
  {
    icon: FileText,
    title: "5. Contributor License Agreements",
    content:
      "CLAHub facilitates the creation and signing of CLAs between project maintainers and contributors. CLAHub is not a party to any CLA created through the Service. The legal relationship created by a CLA is solely between the project maintainer and the contributor.",
  },
  {
    icon: Database,
    title: "6. Data and Content",
    content:
      "You retain ownership of any content you submit through the Service, including CLA text and signatures. By using the Service, you grant CLAHub a limited license to store and display this content as necessary to provide the Service.",
  },
  {
    icon: ServerCog,
    title: "7. Availability and Modifications",
    content:
      "We reserve the right to modify, suspend, or discontinue the Service at any time. We will make reasonable efforts to notify users of significant changes.",
  },
  {
    icon: AlertTriangle,
    title: "8. Limitation of Liability",
    content:
      'The Service is provided \u201cas is\u201d without warranties of any kind. CLAHub shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.',
  },
  {
    icon: RefreshCw,
    title: "9. Changes to Terms",
    content:
      "We may update these Terms of Service from time to time. Continued use of the Service after changes constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Terms of <span className="text-primary">Service</span>
        </h1>
        <p className="text-muted-foreground">Last updated: February 2026</p>
      </section>

      {/* Sections */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-20 md:py-24">
          <div className="mx-auto grid max-w-2xl gap-6">
            {sections.map((s) => (
              <Card key={s.title} className="border-0 text-center shadow-none">
                <CardContent className="flex flex-col items-center gap-3">
                  <s.icon className="text-primary size-6" />
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                  {s.content && (
                    <p className="text-muted-foreground text-sm">
                      {s.content}
                    </p>
                  )}
                  {s.list && (
                    <ul className="text-muted-foreground mt-1 list-inside list-disc space-y-1 text-sm">
                      {s.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
