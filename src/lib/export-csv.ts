import Papa from "papaparse";

export interface SignatureRow {
  name: string | null;
  username: string;
  email: string | null;
  signedAt: Date;
  version: number;
  ipAddress: string | null;
  source: string;
  revokedAt: Date | null;
  fields: Record<string, string | null>;
}

export interface CsvOptions {
  includeRevoked?: boolean;
  fieldLabels?: string[];
}

export function generateSignaturesCsv(
  rows: SignatureRow[],
  options: CsvOptions = {},
): string {
  const { includeRevoked = false, fieldLabels = [] } = options;

  const filtered = includeRevoked
    ? rows
    : rows.filter((r) => !r.revokedAt);

  const data = filtered.map((row) => {
    const base: Record<string, string> = {
      Name: row.name ?? "",
      "GitHub Username": row.username,
      Email: row.email ?? "",
      "Date Signed": row.signedAt.toISOString(),
      "CLA Version": String(row.version),
      "IP Address": row.ipAddress ?? "",
      Source: row.source,
    };

    if (includeRevoked) {
      base["Revoked At"] = row.revokedAt?.toISOString() ?? "";
    }

    for (const label of fieldLabels) {
      base[label] = row.fields[label] ?? "";
    }

    return base;
  });

  return Papa.unparse(data);
}
