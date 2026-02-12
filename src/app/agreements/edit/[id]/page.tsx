import { notFound } from "next/navigation";
import { AgreementForm } from "@/components/agreements/agreement-form";
import { ExclusionManager } from "@/components/agreements/exclusion-manager";
import { ReadOnlyAgreementView } from "@/components/agreements/read-only-agreement-view";
import { SignatoriesList } from "@/components/agreements/signatories-list";
import { NotificationToggle } from "@/components/agreements/notification-toggle";
import { SignatureManager } from "@/components/agreements/signature-manager";
import { TransferOwnershipSection } from "@/components/agreements/transfer-ownership-section";
import { ContributingMdSection } from "@/components/agreements/contributing-md-section";
import { getAgreementAccessLevel } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import type { AgreementFieldInput } from "@/lib/schemas/agreement";

export const metadata = {
	title: "Edit Agreement",
};

export default async function EditAgreementPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const agreementId = parseInt(id, 10);
	if (isNaN(agreementId)) notFound();

	const agreement = await prisma.agreement.findUnique({
		where: { id: agreementId },
		include: {
			versions: { orderBy: { version: "desc" }, take: 1 },
			fields: {
				where: { enabled: true },
				orderBy: { sortOrder: "asc" },
			},
			exclusions: true,
			signatures: {
				include: {
					user: { select: { nickname: true, email: true, avatarUrl: true } },
					version: { select: { version: true } },
				},
				orderBy: { signedAt: "desc" },
			},
		},
	});

	if (!agreement || agreement.deletedAt) notFound();

	const { level } = await getAgreementAccessLevel(
		agreement.ownerId,
		agreement.ownerName,
	);

	if (level === "none") notFound();

	const latestText = agreement.versions[0]?.text ?? "";
	const scopeLabel =
		agreement.scope === "org"
			? `${agreement.ownerName} (Org-wide)`
			: `${agreement.ownerName}/${agreement.repoName}`;

	if (level === "org_admin") {
		return (
			<div className="mx-auto max-w-2xl space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Agreement Details
					</h1>
					<p className="text-muted-foreground">{scopeLabel}</p>
				</div>

				<ReadOnlyAgreementView text={latestText} />
				<SignatoriesList signatures={agreement.signatures} agreementId={agreement.id} />
			</div>
		);
	}

	// level === "owner"
	const fields: AgreementFieldInput[] = agreement.fields.map((f) => ({
		id: f.id,
		label: f.label,
		dataType: f.dataType as AgreementFieldInput["dataType"],
		required: f.required,
		description: f.description ?? "",
		sortOrder: f.sortOrder,
		enabled: f.enabled,
	}));

	const exclusions = agreement.exclusions.map((e) => ({
		id: e.id,
		type: e.type,
		githubLogin: e.githubLogin,
		githubTeamSlug: e.githubTeamId,
	}));

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Edit Agreement</h1>
				<p className="text-muted-foreground">{scopeLabel}</p>
			</div>

			<AgreementForm
				mode="edit"
				agreementId={agreement.id}
				initialText={latestText}
				initialFields={fields}
			/>

			<ExclusionManager
				agreementId={agreement.id}
				ownerName={agreement.ownerName}
				initialExclusions={exclusions}
			/>

			<SignatoriesList signatures={agreement.signatures} agreementId={agreement.id} isOwner />

			<SignatureManager agreementId={agreement.id} />

			<NotificationToggle
				agreementId={agreement.id}
				initialEnabled={agreement.notifyOnSign}
			/>

			{agreement.scope === "repo" && agreement.repoName && (
				<ContributingMdSection
					ownerName={agreement.ownerName}
					repoName={agreement.repoName}
					installationId={agreement.installationId}
				/>
			)}

			<TransferOwnershipSection
				agreementId={agreement.id}
				agreementName={scopeLabel}
			/>
		</div>
	);
}
