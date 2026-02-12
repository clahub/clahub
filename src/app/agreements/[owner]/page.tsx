import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignedBanner } from "@/components/agreements/signed-banner";
import { SigningForm } from "@/components/agreements/signing-form";
import type { SerializedField } from "@/lib/schemas/signing";

interface PageProps {
  params: Promise<{ owner: string }>;
  searchParams: Promise<{ referrer?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { owner } = await params;
  return { title: `Sign CLA — ${owner}` };
}

function isValidReferrer(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com" && parsed.protocol === "https:") {
      return url;
    }
  } catch {
    // invalid URL
  }
  return null;
}

export default async function OrgSigningPage({
  params,
  searchParams,
}: PageProps) {
  const { owner } = await params;
  const { referrer: rawReferrer } = await searchParams;
  const referrer = isValidReferrer(rawReferrer);

  const agreement = await prisma.agreement.findFirst({
    where: {
      ownerName: owner,
      scope: "org",
      deletedAt: null,
    },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!agreement) notFound();

  const latestVersion = agreement.versions[0];
  if (!latestVersion) notFound();

  const session = await auth();
  const userId = session?.user ? parseInt(session.user.id, 10) : null;

  const existingSignature =
    userId != null
      ? await prisma.signature.findUnique({
          where: {
            userId_agreementId: { userId, agreementId: agreement.id },
          },
          include: {
            version: { select: { version: true } },
          },
        })
      : null;

  const isSigned = existingSignature && !existingSignature.revokedAt;

  const serializedFields: SerializedField[] = agreement.fields.map((f) => ({
    id: f.id,
    label: f.label,
    dataType: f.dataType as SerializedField["dataType"],
    required: f.required,
    description: f.description,
    sortOrder: f.sortOrder,
  }));

  const callbackPath = `/agreements/${owner}${rawReferrer ? `?referrer=${encodeURIComponent(rawReferrer)}` : ""}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Contributor License Agreement
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">{owner}</span>
          <Badge>Org-wide</Badge>
          <Badge variant="secondary">v{latestVersion.version}</Badge>
        </div>
      </div>

      {isSigned && (
        <SignedBanner
          signedAt={existingSignature.signedAt}
          version={existingSignature.version.version}
          referrer={referrer}
        />
      )}

      <div className="prose dark:prose-invert max-w-none rounded-md border p-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {latestVersion.text}
        </ReactMarkdown>
      </div>

      {!session?.user && (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Sign in with GitHub to sign this agreement
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("github-contributor", {
                redirectTo: callbackPath,
              });
            }}
          >
            <Button type="submit" size="lg">
              Sign in with GitHub
            </Button>
          </form>
        </div>
      )}

      {session?.user && !isSigned && (
        <SigningForm
          agreementId={agreement.id}
          fields={serializedFields}
          referrer={referrer}
        />
      )}
    </div>
  );
}
