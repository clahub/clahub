import { z } from "zod";
import type { FieldDataType } from "./agreement";

export interface SerializedField {
  id: number;
  label: string;
  dataType: FieldDataType;
  required: boolean;
  description: string | null;
  sortOrder: number;
}

export function buildSigningSchema(fields: SerializedField[]) {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    const key = `field_${field.id}`;

    switch (field.dataType) {
      case "checkbox":
        shape[key] = field.required
          ? z
              .boolean()
              .refine((v) => v === true, {
                message: `${field.label} is required`,
              })
          : z.boolean().default(false);
        break;
      case "email":
        shape[key] = field.required
          ? z.string().min(1, `${field.label} is required`).email("Invalid email")
          : z.string().email("Invalid email").or(z.literal(""));
        break;
      case "url":
        shape[key] = field.required
          ? z.string().min(1, `${field.label} is required`).url("Invalid URL")
          : z.string().url("Invalid URL").or(z.literal(""));
        break;
      default: // text, date
        shape[key] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().default("");
        break;
    }
  }

  return z.object(shape);
}

export function buildDefaultValues(
  fields: SerializedField[]
): Record<string, string | boolean> {
  const defaults: Record<string, string | boolean> = {};
  for (const field of fields) {
    const key = `field_${field.id}`;
    defaults[key] = field.dataType === "checkbox" ? false : "";
  }
  return defaults;
}
