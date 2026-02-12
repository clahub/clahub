import { describe, it, expect } from "vitest";
import { generateSignaturesCsv, type SignatureRow } from "@/lib/export-csv";

function makeRow(overrides: Partial<SignatureRow> = {}): SignatureRow {
  return {
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    signedAt: new Date("2026-01-15T10:00:00Z"),
    version: 1,
    ipAddress: "192.168.1.1",
    source: "online",
    revokedAt: null,
    fields: {},
    ...overrides,
  };
}

describe("generateSignaturesCsv", () => {
  it("generates CSV with correct headers", () => {
    const csv = generateSignaturesCsv([makeRow()]);
    const lines = csv.split(/\r?\n/);
    expect(lines[0]).toBe(
      "Name,GitHub Username,Email,Date Signed,CLA Version,IP Address,Source",
    );
  });

  it("includes all required columns in data rows", () => {
    const csv = generateSignaturesCsv([makeRow()]);
    const lines = csv.split(/\r?\n/);
    expect(lines[1]).toContain("Test User");
    expect(lines[1]).toContain("testuser");
    expect(lines[1]).toContain("test@example.com");
    expect(lines[1]).toContain("2026-01-15");
    expect(lines[1]).toContain("192.168.1.1");
    expect(lines[1]).toContain("online");
  });

  it("handles empty signature list", () => {
    const csv = generateSignaturesCsv([]);
    const lines = csv.split(/\r?\n/);
    expect(lines).toHaveLength(1); // headers only
  });

  it("handles null fields gracefully", () => {
    const csv = generateSignaturesCsv([
      makeRow({ name: null, email: null, ipAddress: null }),
    ]);
    const lines = csv.split(/\r?\n/);
    // Should not contain "null" string
    expect(lines[1]).not.toContain("null");
  });

  it("excludes revoked signatures by default", () => {
    const csv = generateSignaturesCsv([
      makeRow({ username: "active" }),
      makeRow({ username: "revoked", revokedAt: new Date() }),
    ]);
    const lines = csv.split(/\r?\n/);
    expect(lines).toHaveLength(2); // header + 1 active
    expect(csv).toContain("active");
    expect(csv).not.toContain("revoked");
  });

  it("includes revoked signatures when option is set", () => {
    const csv = generateSignaturesCsv(
      [
        makeRow({ username: "active" }),
        makeRow({ username: "revoked", revokedAt: new Date("2026-02-01") }),
      ],
      { includeRevoked: true },
    );
    expect(csv).toContain("active");
    expect(csv).toContain("revoked");
    expect(csv).toContain("Revoked At");
  });

  it("includes custom field columns", () => {
    const csv = generateSignaturesCsv(
      [makeRow({ fields: { Company: "Acme Corp", Title: "Engineer" } })],
      { fieldLabels: ["Company", "Title"] },
    );
    const lines = csv.split(/\r?\n/);
    expect(lines[0]).toContain("Company");
    expect(lines[0]).toContain("Title");
    expect(lines[1]).toContain("Acme Corp");
    expect(lines[1]).toContain("Engineer");
  });

  it("escapes special characters in values", () => {
    const csv = generateSignaturesCsv([
      makeRow({ name: 'O"Brien, Jr.' }),
    ]);
    // papaparse should quote fields containing commas or quotes
    expect(csv).toContain('"');
  });

  it("handles multiple rows", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ username: `user${i}` }),
    );
    const csv = generateSignaturesCsv(rows);
    const lines = csv.split(/\r?\n/);
    expect(lines).toHaveLength(6); // header + 5 rows
  });
});
