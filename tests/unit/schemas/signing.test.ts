import { describe, it, expect } from "vitest";
import { buildSigningSchema, buildDefaultValues } from "@/lib/schemas/signing";
import type { SerializedField } from "@/lib/schemas/signing";

function makeField(overrides: Partial<SerializedField> & { id: number }): SerializedField {
  return {
    label: "Test Field",
    dataType: "text",
    required: true,
    description: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe("buildSigningSchema", () => {
  it("creates schema for required text field", () => {
    const fields = [makeField({ id: 1, label: "Full Name", dataType: "text", required: true })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_1: "Alice" }).success).toBe(true);
    expect(schema.safeParse({ field_1: "" }).success).toBe(false);
  });

  it("creates schema for optional text field", () => {
    const fields = [makeField({ id: 1, dataType: "text", required: false })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_1: "" }).success).toBe(true);
    expect(schema.safeParse({ field_1: "value" }).success).toBe(true);
  });

  it("creates schema for required email field", () => {
    const fields = [makeField({ id: 2, label: "Email", dataType: "email", required: true })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_2: "alice@example.com" }).success).toBe(true);
    expect(schema.safeParse({ field_2: "" }).success).toBe(false);
    expect(schema.safeParse({ field_2: "not-an-email" }).success).toBe(false);
  });

  it("creates schema for optional email field", () => {
    const fields = [makeField({ id: 2, dataType: "email", required: false })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_2: "" }).success).toBe(true);
    expect(schema.safeParse({ field_2: "alice@example.com" }).success).toBe(true);
    expect(schema.safeParse({ field_2: "bad" }).success).toBe(false);
  });

  it("creates schema for required url field", () => {
    const fields = [makeField({ id: 3, label: "Website", dataType: "url", required: true })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_3: "https://example.com" }).success).toBe(true);
    expect(schema.safeParse({ field_3: "" }).success).toBe(false);
    expect(schema.safeParse({ field_3: "not-a-url" }).success).toBe(false);
  });

  it("creates schema for optional url field", () => {
    const fields = [makeField({ id: 3, dataType: "url", required: false })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_3: "" }).success).toBe(true);
    expect(schema.safeParse({ field_3: "https://example.com" }).success).toBe(true);
  });

  it("creates schema for required checkbox field", () => {
    const fields = [makeField({ id: 4, label: "I agree", dataType: "checkbox", required: true })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_4: true }).success).toBe(true);
    expect(schema.safeParse({ field_4: false }).success).toBe(false);
  });

  it("creates schema for optional checkbox field", () => {
    const fields = [makeField({ id: 4, dataType: "checkbox", required: false })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_4: false }).success).toBe(true);
    expect(schema.safeParse({ field_4: true }).success).toBe(true);
  });

  it("creates schema for required date field", () => {
    const fields = [makeField({ id: 5, label: "Date", dataType: "date", required: true })];
    const schema = buildSigningSchema(fields);
    expect(schema.safeParse({ field_5: "2025-01-01" }).success).toBe(true);
    expect(schema.safeParse({ field_5: "" }).success).toBe(false);
  });

  it("handles multiple fields combined", () => {
    const fields = [
      makeField({ id: 1, label: "Name", dataType: "text", required: true }),
      makeField({ id: 2, label: "Email", dataType: "email", required: true }),
      makeField({ id: 3, label: "Agree", dataType: "checkbox", required: true }),
    ];
    const schema = buildSigningSchema(fields);

    expect(
      schema.safeParse({
        field_1: "Alice",
        field_2: "alice@example.com",
        field_3: true,
      }).success,
    ).toBe(true);

    expect(
      schema.safeParse({
        field_1: "",
        field_2: "alice@example.com",
        field_3: true,
      }).success,
    ).toBe(false);
  });

  it("includes field label in validation message", () => {
    const fields = [makeField({ id: 1, label: "Full Name", dataType: "text", required: true })];
    const schema = buildSigningSchema(fields);
    const result = schema.safeParse({ field_1: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("Full Name"))).toBe(true);
    }
  });

  it("returns empty schema for no fields", () => {
    const schema = buildSigningSchema([]);
    expect(schema.safeParse({}).success).toBe(true);
  });
});

describe("buildDefaultValues", () => {
  it("returns empty string for text fields", () => {
    const fields = [makeField({ id: 1, dataType: "text" })];
    const defaults = buildDefaultValues(fields);
    expect(defaults).toEqual({ field_1: "" });
  });

  it("returns false for checkbox fields", () => {
    const fields = [makeField({ id: 1, dataType: "checkbox" })];
    const defaults = buildDefaultValues(fields);
    expect(defaults).toEqual({ field_1: false });
  });

  it("returns empty string for email, url, date fields", () => {
    const fields = [
      makeField({ id: 1, dataType: "email" }),
      makeField({ id: 2, dataType: "url" }),
      makeField({ id: 3, dataType: "date" }),
    ];
    const defaults = buildDefaultValues(fields);
    expect(defaults).toEqual({ field_1: "", field_2: "", field_3: "" });
  });

  it("handles multiple fields", () => {
    const fields = [
      makeField({ id: 1, dataType: "text" }),
      makeField({ id: 2, dataType: "checkbox" }),
      makeField({ id: 3, dataType: "email" }),
    ];
    const defaults = buildDefaultValues(fields);
    expect(defaults).toEqual({
      field_1: "",
      field_2: false,
      field_3: "",
    });
  });

  it("returns empty object for no fields", () => {
    expect(buildDefaultValues([])).toEqual({});
  });
});
