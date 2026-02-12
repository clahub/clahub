import { z } from "zod";
import { agreementFieldSchema, fieldDataTypes } from "./agreement";

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const revokeApiKeySchema = z.object({
  id: z.number().int().positive(),
});

const apiFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  dataType: z.enum(fieldDataTypes),
  required: z.boolean().default(true),
  description: z.string().optional().default(""),
  sortOrder: z.number().int().min(0).default(0),
});

const apiRepoAgreementSchema = z.object({
  scope: z.literal("repo"),
  ownerName: z.string().min(1),
  repoName: z.string().min(1),
  githubRepoId: z.string().min(1),
  text: z.string().min(10, "Agreement text must be at least 10 characters"),
  fields: z.array(apiFieldSchema).default([]),
});

const apiOrgAgreementSchema = z.object({
  scope: z.literal("org"),
  ownerName: z.string().min(1),
  githubOrgId: z.string().min(1),
  text: z.string().min(10, "Agreement text must be at least 10 characters"),
  fields: z.array(apiFieldSchema).default([]),
});

export const apiCreateAgreementSchema = z.discriminatedUnion("scope", [
  apiRepoAgreementSchema,
  apiOrgAgreementSchema,
]);

export const apiUpdateAgreementSchema = z.object({
  text: z.string().min(10, "Agreement text must be at least 10 characters"),
  changelog: z.string().optional().default(""),
  fields: z.array(agreementFieldSchema).default([]),
});

export const apiSignAgreementSchema = z.object({
  fields: z.record(z.string(), z.string().or(z.boolean())),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;
export type ApiCreateAgreementInput = z.infer<typeof apiCreateAgreementSchema>;
export type ApiUpdateAgreementInput = z.infer<typeof apiUpdateAgreementSchema>;
export type ApiSignAgreementInput = z.infer<typeof apiSignAgreementSchema>;
