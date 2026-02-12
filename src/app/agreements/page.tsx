import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminOrgs } from "@/lib/org-membership";
import { Button } from "@/components/ui/button";
import { AgreementCard } from "@/components/agreements/agreement-card";

export const metadata = {
  title: "Agreements",
};

export default async function AgreementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const userId = parseInt(session.user.id, 10);

  const adminOrgLogins = session.user.accessToken
    ? await getAdminOrgs(session.user.accessToken)
    : [];

  const agreements = await prisma.agreement.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownerId: userId },
        ...(adminOrgLogins.length > 0
          ? [{ ownerName: { in: adminOrgLogins } }]
          : []),
      ],
    },
    include: {
      _count: { select: { signatures: true } },
      versions: { orderBy: { version: "desc" as const }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agreements</h1>
          <p className="text-muted-foreground">
            Manage CLAs for your repositories
          </p>
        </div>
        <Button asChild>
          <Link href="/agreements/new">
            <Plus className="size-4" />
            New Agreement
          </Link>
        </Button>
      </div>

      {agreements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="text-muted-foreground mb-4 size-12" />
          <h2 className="text-xl font-semibold">No agreements yet</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Create your first Contributor License Agreement to start collecting
            signatures from contributors.
          </p>
          <Button asChild className="mt-6">
            <Link href="/agreements/new">
              <Plus className="size-4" />
              Create your first agreement
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agreements.map((agreement) => (
            <AgreementCard
              key={agreement.id}
              id={agreement.id}
              scope={agreement.scope}
              ownerName={agreement.ownerName}
              repoName={agreement.repoName}
              signatureCount={agreement._count.signatures}
              version={agreement.versions[0]?.version ?? 1}
              createdAt={agreement.createdAt}
              accessLevel={
                agreement.ownerId === userId ? "owner" : "org_admin"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
