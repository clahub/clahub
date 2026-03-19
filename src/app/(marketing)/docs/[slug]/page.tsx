import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DOCS_DIR = path.join(process.cwd(), "docs");

const VALID_SLUGS: Record<string, string> = {
  "user-guide": "user-guide.md",
  "owner-howto": "owner-howto.md",
  "contributor-howto": "contributor-howto.md",
};

const TITLES: Record<string, string> = {
  "user-guide": "User Guide",
  "owner-howto": "Owner How-To Guide",
  "contributor-howto": "Contributor How-To Guide",
};

export function generateStaticParams() {
  return Object.keys(VALID_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = TITLES[slug] ?? "Documentation";
  return {
    title: `${title} — CLAHub`,
    description: `CLAHub ${title}`,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filename = VALID_SLUGS[slug];
  if (!filename) notFound();

  const filePath = path.join(DOCS_DIR, filename);
  if (!fs.existsSync(filePath)) notFound();

  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <div className="container max-w-4xl py-16 px-4 md:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/docs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Docs
          </Link>
        </Button>
      </div>

      <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-table:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
