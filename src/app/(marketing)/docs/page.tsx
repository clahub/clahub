import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Shield } from "lucide-react";

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
    <div className="container max-w-4xl py-16 px-4 md:px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Everything you need to know about using CLAHub.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {docs.map((doc) => (
          <Link key={doc.slug} href={`/docs/${doc.slug}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-4">
                <doc.icon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{doc.title}</CardTitle>
                  <CardDescription className="mt-1">{doc.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
