import { z } from "zod";

export const addManualSignatureSchema = z
  .object({
    agreementId: z.number().int().positive(),
    githubLogin: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    name: z.string().optional(),
    signedAt: z.string().datetime().optional(),
  })
  .refine((data) => data.githubLogin || data.email, {
    message: "Either GitHub username or email is required",
    path: ["githubLogin"],
  });

export type AddManualSignatureInput = z.infer<typeof addManualSignatureSchema>;

export const csvSignatureRowSchema = z
  .object({
    githubLogin: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    name: z.string().optional(),
    signedAt: z.string().optional(),
  })
  .refine((data) => data.githubLogin || data.email, {
    message: "Either GitHub username or email is required",
  });

export type CsvSignatureRow = z.infer<typeof csvSignatureRowSchema>;

export const importCsvSignaturesSchema = z.object({
  agreementId: z.number().int().positive(),
  rows: z.array(csvSignatureRowSchema).min(1, "At least one row is required"),
});

export type ImportCsvSignaturesInput = z.infer<
  typeof importCsvSignaturesSchema
>;

export const revokeSignatureSchema = z.object({
  signatureId: z.number().int().positive(),
  agreementId: z.number().int().positive(),
});

export type RevokeSignatureInput = z.infer<typeof revokeSignatureSchema>;

export const unrevokeSignatureSchema = z.object({
  signatureId: z.number().int().positive(),
  agreementId: z.number().int().positive(),
});

export type UnrevokeSignatureInput = z.infer<typeof unrevokeSignatureSchema>;
