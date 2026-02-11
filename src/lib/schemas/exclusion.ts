import { z } from "zod";

export const exclusionTypes = ["bot_auto", "user"] as const;

export type ExclusionType = (typeof exclusionTypes)[number];

export const createExclusionSchema = z
  .object({
    agreementId: z.number().int().positive(),
    type: z.enum(exclusionTypes),
    githubLogin: z.string().optional(),
  })
  .refine(
    (data) => data.type !== "user" || (data.githubLogin && data.githubLogin.length > 0),
    { message: "GitHub login is required for user exclusions", path: ["githubLogin"] },
  );

export const deleteExclusionSchema = z.object({
  id: z.number().int().positive(),
  agreementId: z.number().int().positive(),
});

export type CreateExclusionInput = z.infer<typeof createExclusionSchema>;
export type DeleteExclusionInput = z.infer<typeof deleteExclusionSchema>;
