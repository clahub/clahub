import { describe, it, expect } from "vitest";
import { apiSignAgreementSchema } from "@/lib/schemas/api";

describe("apiSignAgreementSchema — corporate fields", () => {
  it("accepts individual signature without corporate fields", () => {
    const result = apiSignAgreementSchema.safeParse({
      signatureType: "individual",
      fields: {},
    });
    expect(result.success).toBe(true);
  });

  it("defaults signatureType to individual", () => {
    const result = apiSignAgreementSchema.safeParse({ fields: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.signatureType).toBe("individual");
    }
  });

  it("accepts corporate signature with all required fields", () => {
    const result = apiSignAgreementSchema.safeParse({
      signatureType: "corporate",
      companyName: "Acme Corp",
      companyDomain: "acme.com",
      companyTitle: "CTO",
      fields: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects corporate signature without companyName", () => {
    const result = apiSignAgreementSchema.safeParse({
      signatureType: "corporate",
      companyDomain: "acme.com",
      companyTitle: "CTO",
      fields: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects corporate signature without companyDomain", () => {
    const result = apiSignAgreementSchema.safeParse({
      signatureType: "corporate",
      companyName: "Acme Corp",
      companyTitle: "CTO",
      fields: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects corporate signature without companyTitle", () => {
    const result = apiSignAgreementSchema.safeParse({
      signatureType: "corporate",
      companyName: "Acme Corp",
      companyDomain: "acme.com",
      fields: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid companyDomain format", () => {
    const result = apiSignAgreementSchema.safeParse({
      signatureType: "corporate",
      companyName: "Acme Corp",
      companyDomain: "not a domain",
      companyTitle: "CTO",
      fields: {},
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid domain formats", () => {
    for (const domain of ["example.com", "sub.example.co.uk", "a-b.io"]) {
      const result = apiSignAgreementSchema.safeParse({
        signatureType: "corporate",
        companyName: "Test",
        companyDomain: domain,
        companyTitle: "VP",
        fields: {},
      });
      expect(result.success).toBe(true);
    }
  });
});
