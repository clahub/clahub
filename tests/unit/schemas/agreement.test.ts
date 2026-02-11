import { describe, it, expect } from "vitest";
import {
  createAgreementSchema,
  updateAgreementSchema,
  deleteAgreementSchema,
  agreementFieldSchema,
} from "@/lib/schemas/agreement";

describe("agreementFieldSchema", () => {
  it("accepts valid field input", () => {
    const result = agreementFieldSchema.safeParse({
      label: "Full Name",
      dataType: "text",
      required: true,
      description: "Your legal name",
      sortOrder: 0,
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("validates dataType enum", () => {
    for (const type of ["text", "email", "url", "checkbox", "date"] as const) {
      const result = agreementFieldSchema.safeParse({
        label: "Test",
        dataType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid dataType", () => {
    const result = agreementFieldSchema.safeParse({
      label: "Test",
      dataType: "number",
    });
    expect(result.success).toBe(false);
  });

  it("requires non-empty label", () => {
    const result = agreementFieldSchema.safeParse({
      label: "",
      dataType: "text",
    });
    expect(result.success).toBe(false);
  });

  it("applies defaults for optional fields", () => {
    const result = agreementFieldSchema.parse({
      label: "Name",
      dataType: "text",
    });
    expect(result.required).toBe(true);
    expect(result.description).toBe("");
    expect(result.sortOrder).toBe(0);
    expect(result.enabled).toBe(true);
  });

  it("allows optional id", () => {
    const result = agreementFieldSchema.safeParse({
      id: 42,
      label: "Name",
      dataType: "text",
    });
    expect(result.success).toBe(true);
    expect(result.data!.id).toBe(42);
  });
});

describe("createAgreementSchema", () => {
  const validInput = {
    githubRepoId: "12345",
    ownerName: "testowner",
    repoName: "testrepo",
    text: "This is a CLA agreement text that is long enough",
  };

  it("accepts valid input", () => {
    const result = createAgreementSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("requires githubRepoId", () => {
    const result = createAgreementSchema.safeParse({
      ...validInput,
      githubRepoId: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires ownerName", () => {
    const result = createAgreementSchema.safeParse({
      ...validInput,
      ownerName: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires repoName", () => {
    const result = createAgreementSchema.safeParse({
      ...validInput,
      repoName: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires text of at least 10 characters", () => {
    const result = createAgreementSchema.safeParse({
      ...validInput,
      text: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("defaults fields to empty array", () => {
    const result = createAgreementSchema.parse(validInput);
    expect(result.fields).toEqual([]);
  });

  it("accepts fields array", () => {
    const result = createAgreementSchema.safeParse({
      ...validInput,
      fields: [{ label: "Name", dataType: "text" }],
    });
    expect(result.success).toBe(true);
    expect(result.data!.fields).toHaveLength(1);
  });

  it("accepts optional installationId", () => {
    const result = createAgreementSchema.safeParse({
      ...validInput,
      installationId: "99999",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateAgreementSchema", () => {
  it("accepts valid input", () => {
    const result = updateAgreementSchema.safeParse({
      id: 1,
      text: "Updated agreement text that is long enough",
    });
    expect(result.success).toBe(true);
  });

  it("requires positive integer id", () => {
    const result = updateAgreementSchema.safeParse({
      id: 0,
      text: "Updated agreement text that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative id", () => {
    const result = updateAgreementSchema.safeParse({
      id: -1,
      text: "Updated agreement text that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("requires text min length", () => {
    const result = updateAgreementSchema.safeParse({
      id: 1,
      text: "short",
    });
    expect(result.success).toBe(false);
  });

  it("defaults changelog to empty string", () => {
    const result = updateAgreementSchema.parse({
      id: 1,
      text: "Updated agreement text that is long enough",
    });
    expect(result.changelog).toBe("");
  });
});

describe("deleteAgreementSchema", () => {
  it("accepts valid positive integer", () => {
    const result = deleteAgreementSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects zero", () => {
    const result = deleteAgreementSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative numbers", () => {
    const result = deleteAgreementSchema.safeParse({ id: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer", () => {
    const result = deleteAgreementSchema.safeParse({ id: 1.5 });
    expect(result.success).toBe(false);
  });
});
