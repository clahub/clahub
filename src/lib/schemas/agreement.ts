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

export const createAgreementSchema = z.object({
  githubRepoId: z.string().min(1, "Repository is required"),
  ownerName: z.string().min(1),
  repoName: z.string().min(1),
  installationId: z.string().optional(),
  text: z.string().min(10, "Agreement text must be at least 10 characters"),
  fields: z.array(agreementFieldSchema).default([]),
});

export const updateAgreementSchema = z.object({
  id: z.number().int().positive(),
  text: z.string().min(10, "Agreement text must be at least 10 characters"),
  changelog: z.string().optional().default(""),
  fields: z.array(agreementFieldSchema).default([]),
});

export const deleteAgreementSchema = z.object({
  id: z.number().int().positive(),
});

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof updateAgreementSchema>;
export type DeleteAgreementInput = z.infer<typeof deleteAgreementSchema>;
export type AgreementFieldInput = z.infer<typeof agreementFieldSchema>;
