import { z } from "zod";

export const fieldDataTypes = [
	"text",
	"email",
	"url",
	"checkbox",
	"date",
] as const;

export type FieldDataType = (typeof fieldDataTypes)[number];

export const agreementFieldSchema = z.object({
	id: z.number().optional(),
	label: z.string().min(1, "Label is required"),
	dataType: z.enum(fieldDataTypes),
	required: z.boolean().default(true),
	description: z.string().optional().default(""),
	sortOrder: z.number().int().min(0).default(0),
	enabled: z.boolean().default(true),
});

const sharedFields = {
	ownerName: z.string().min(1),
	installationId: z.string().optional(),
	text: z.string().min(10, "Agreement text must be at least 10 characters"),
	fields: z.array(agreementFieldSchema).default([]),
};

const repoScopeSchema = z.object({
	scope: z.literal("repo"),
	githubRepoId: z.string().min(1, "Repository is required"),
	repoName: z.string().min(1),
	...sharedFields,
});

const orgScopeSchema = z.object({
	scope: z.literal("org"),
	githubOrgId: z.string().min(1, "Organization is required"),
	...sharedFields,
});

const discriminatedSchema = z.discriminatedUnion("scope", [
	repoScopeSchema,
	orgScopeSchema,
]);

/** Defaults `scope` to `"repo"` when omitted for backward compatibility. */
export const createAgreementSchema = z.preprocess((val) => {
	if (val && typeof val === "object" && !("scope" in val)) {
		return { ...val, scope: "repo" };
	}
	return val;
}, discriminatedSchema) as z.ZodType<z.infer<typeof discriminatedSchema>>;

export const updateAgreementSchema = z.object({
	id: z.number().int().positive(),
	text: z.string().min(10, "Agreement text must be at least 10 characters"),
	changelog: z.string().optional().default(""),
	fields: z.array(agreementFieldSchema).default([]),
});

export const deleteAgreementSchema = z.object({
	id: z.number().int().positive(),
});

export const transferAgreementSchema = z.object({
	agreementId: z.number().int().positive(),
	newOwnerLogin: z.string().min(1, "GitHub username is required"),
});

export const updateNotificationSchema = z.object({
	agreementId: z.number().int().positive(),
	notifyOnSign: z.boolean(),
});

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof updateAgreementSchema>;
export type DeleteAgreementInput = z.infer<typeof deleteAgreementSchema>;
export type TransferAgreementInput = z.infer<typeof transferAgreementSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type AgreementFieldInput = z.infer<typeof agreementFieldSchema>;
