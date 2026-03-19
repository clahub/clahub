import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ArrowLeft, BookOpen, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const DOCS_DIR = path.join(process.cwd(), "docs");

const VALID_SLUGS: Record<string, { file: string; title: string; subtitle: string; icon: typeof BookOpen }> = {
  "user-guide": {
    file: "user-guide.md",
    title: "User Guide",
    subtitle: "Complete reference for all CLAHub features.",
    icon: BookOpen,
  },
  "owner-howto": {
    file: "owner-howto.md",
    title: "Owner How-To",
    subtitle: "Step-by-step walkthrough for project owners.",
    icon: Shield,
  },
  "contributor-howto": {
    file: "contributor-howto.md",
    title: "Contributor How-To",
    subtitle: "Quick guide for signing a CLA.",
    icon: Users,
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = VALID_SLUGS[slug];
  const title = doc?.title ?? "Documentation";
  return {
    title: `${title} — CLAHub`,
    description: doc?.subtitle ?? `CLAHub ${title}`,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = VALID_SLUGS[slug];
  if (!doc) notFound();

  const filePath = path.join(DOCS_DIR, doc.file);
  if (!fs.existsSync(filePath)) notFound();

  let content = fs.readFileSync(filePath, "utf-8");

  // Strip the first H1 (we render it in the hero)
  content = content.replace(/^#\s+.+\n+/, "");

  const Icon = doc.icon;

  return (
    <>
      {/* Hero — matches terms/privacy page style */}
      <section className="container flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
        <Icon className="text-primary size-10" />
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {doc.title}
        </h1>
        <p className="text-muted-foreground">{doc.subtitle}</p>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/docs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Docs
          </Link>
        </Button>
      </section>

      {/* Content — muted background matching terms/privacy */}
      <section className="bg-muted/50 border-y">
        <div className="container px-4 py-16 md:py-20">
          <article className="prose prose-neutral dark:prose-invert mx-auto max-w-2xl prose-headings:scroll-mt-20 prose-a:text-primary prose-table:text-sm prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-p:text-sm prose-p:text-muted-foreground prose-li:text-sm prose-li:text-muted-foreground prose-td:text-sm prose-th:text-sm prose-code:text-sm prose-pre:bg-background prose-pre:border prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-hr:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      </section>
    </>
  );
}
