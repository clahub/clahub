import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(fields && { fields }) } },
    { status },
  );
}

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
