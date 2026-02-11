import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgreementForm } from "@/components/agreements/agreement-form";
import type { AgreementFieldInput } from "@/lib/schemas/agreement";

export const metadata = {
  title: "Edit Agreement",
};

export default async function EditAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const agreementId = parseInt(id, 10);
  if (isNaN(agreementId)) notFound();

  const userId = parseInt(session.user.id, 10);

  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: {
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
    notFound();
  }

  const latestText = agreement.versions[0]?.text ?? "";
  const fields: AgreementFieldInput[] = agreement.fields.map((f) => ({
    id: f.id,
    label: f.label,
    dataType: f.dataType as AgreementFieldInput["dataType"],
    required: f.required,
    description: f.description ?? "",
    sortOrder: f.sortOrder,
    enabled: f.enabled,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Agreement</h1>
        <p className="text-muted-foreground">
          {agreement.ownerName}/{agreement.repoName}
        </p>
      </div>

      <AgreementForm
        mode="edit"
        agreementId={agreement.id}
        initialText={latestText}
        initialFields={fields}
      />
    </div>
  );
}
