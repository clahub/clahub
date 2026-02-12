import { describe, it, expect } from "vitest";
import {
  createExclusionSchema,
  deleteExclusionSchema,
} from "@/lib/schemas/exclusion";

describe("createExclusionSchema", () => {
  it("accepts bot_auto type without githubLogin", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "bot_auto",
    });
    expect(result.success).toBe(true);
  });

  it("accepts bot_auto type with githubLogin", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "bot_auto",
      githubLogin: "dependabot[bot]",
    });
    expect(result.success).toBe(true);
  });

  it("accepts user type with githubLogin", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "user",
      githubLogin: "alice",
    });
    expect(result.success).toBe(true);
  });

  it("rejects user type without githubLogin", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "user",
    });
    expect(result.success).toBe(false);
  });

  it("rejects user type with empty githubLogin", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "user",
      githubLogin: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts team type with githubTeamSlug", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "team",
      githubTeamSlug: "engineering",
    });
    expect(result.success).toBe(true);
  });

  it("rejects team type without githubTeamSlug", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "team",
    });
    expect(result.success).toBe(false);
  });

  it("rejects team type with empty githubTeamSlug", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "team",
      githubTeamSlug: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 1,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("requires positive agreementId", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: 0,
      type: "bot_auto",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative agreementId", () => {
    const result = createExclusionSchema.safeParse({
      agreementId: -1,
      type: "bot_auto",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteExclusionSchema", () => {
  it("accepts valid input", () => {
    const result = deleteExclusionSchema.safeParse({
      id: 1,
      agreementId: 2,
    });
    expect(result.success).toBe(true);
  });

  it("requires positive id", () => {
    const result = deleteExclusionSchema.safeParse({
      id: 0,
      agreementId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("requires positive agreementId", () => {
    const result = deleteExclusionSchema.safeParse({
      id: 1,
      agreementId: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative values", () => {
    expect(
      deleteExclusionSchema.safeParse({ id: -1, agreementId: 1 }).success,
    ).toBe(false);
    expect(
      deleteExclusionSchema.safeParse({ id: 1, agreementId: -1 }).success,
    ).toBe(false);
  });

  it("rejects non-integer values", () => {
    expect(
      deleteExclusionSchema.safeParse({ id: 1.5, agreementId: 1 }).success,
    ).toBe(false);
  });
});
