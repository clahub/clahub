import { auth } from "@/lib/auth";
import type { z } from "zod";

export type ActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      code?: string;
      fieldErrors?: Record<string, string[]>;
    };

export function formatZodErrors(
  zodError: z.ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export function validationError(zodError: z.ZodError): ActionResult {
  return {
    success: false,
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors: formatZodErrors(zodError),
  };
}

export async function requireOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== "owner") {
    throw new Error("Unauthorized");
  }
  return session.user;
}
