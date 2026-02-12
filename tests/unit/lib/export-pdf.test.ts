import { describe, it, expect } from "vitest";
import {
  generateAgreementPdf,
  type PdfAgreementData,
  type PdfSignatory,
} from "@/lib/export-pdf";

function makeAgreement(
  overrides: Partial<PdfAgreementData> = {},
): PdfAgreementData {
  return {
    ownerName: "acme",
    repoName: "my-project",
    scope: "repo",
    version: 1,
    text: "# CLA\n\nBy signing this agreement, you grant us a license.\n\n## Terms\n\n- Item one\n- Item two\n\n1. First\n2. Second",
    generatedAt: new Date("2026-02-12"),
    ...overrides,
  };
}

function makeSignatory(
  overrides: Partial<PdfSignatory> = {},
): PdfSignatory {
  return {
    username: "testuser",
    name: "Test User",
    signedAt: new Date("2026-01-15"),
    version: 1,
    ...overrides,
  };
}

describe("generateAgreementPdf", () => {
  it("returns a Buffer", async () => {
    const buf = await generateAgreementPdf(makeAgreement());
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("starts with PDF magic bytes", async () => {
    const buf = await generateAgreementPdf(makeAgreement());
    const header = buf.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("works with empty CLA text", async () => {
    const buf = await generateAgreementPdf(makeAgreement({ text: "" }));
    expect(buf.length).toBeGreaterThan(0);
  });

  it("works with org-wide agreement (no repoName)", async () => {
    const buf = await generateAgreementPdf(
      makeAgreement({ repoName: null, scope: "org" }),
    );
    expect(buf.length).toBeGreaterThan(0);
  });

  it("includes signatories when provided", async () => {
    const signatories = [
      makeSignatory({ username: "user1" }),
      makeSignatory({ username: "user2" }),
    ];
    const buf = await generateAgreementPdf(makeAgreement(), signatories);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("works without signatories", async () => {
    const buf = await generateAgreementPdf(makeAgreement());
    expect(buf.length).toBeGreaterThan(0);
  });

  it("handles markdown with headers and lists", async () => {
    const text = [
      "# Main Title",
      "",
      "## Section",
      "",
      "### Subsection",
      "",
      "A paragraph with **bold** and *italic* text.",
      "",
      "- Bullet one",
      "- Bullet two",
      "",
      "1. First item",
      "2. Second item",
    ].join("\n");

    const buf = await generateAgreementPdf(makeAgreement({ text }));
    expect(buf.length).toBeGreaterThan(0);
  });
});
