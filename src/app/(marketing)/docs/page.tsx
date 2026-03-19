import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — CLAHub",
  description: "Guides and reference documentation for CLAHub.",
};

const docs = [
  {
    slug: "user-guide",
    title: "User Guide",
    description: "Complete reference for all CLAHub features — agreements, signatures, API, self-hosting, and more.",
    icon: BookOpen,
  },
  {
    slug: "owner-howto",
    title: "Owner How-To",
    description: "Step-by-step walkthrough for project owners. Go from zero to a fully configured CLA in 10 minutes.",
    icon: Shield,
  },
  {
    slug: "contributor-howto",
    title: "Contributor How-To",
    description: "Quick guide for contributors who need to sign a CLA. Takes about 30 seconds.",
    icon: Users,
  },
];

export default function DocsIndexPage() {
  return (
    <>
      {/* Hero — matches terms/privacy page style */}
      <section className="container flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
        <BookOpen className="text-primary size-10" />
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Documentation
        </h1>
        <p className="text-muted-foreground">Everything you need to know about using CLAHub.</p>
      </section>

      {/* Cards — muted background matching terms/privacy */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-16 md:py-20">
          <div className="mx-auto grid max-w-2xl gap-6">
            {docs.map((doc) => (
              <Link key={doc.slug} href={`/docs/${doc.slug}`}>
                <Card className="border-0 text-center shadow-none transition-colors hover:bg-muted">
                  <CardContent className="flex flex-col items-center gap-3">
                    <doc.icon className="text-primary size-6" />
                    <h2 className="text-lg font-semibold">{doc.title}</h2>
                    <p className="text-muted-foreground text-sm">{doc.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
