import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
  header: { marginBottom: 20, borderBottom: "1 solid #ccc", paddingBottom: 10 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666" },
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 5 },
  h3: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
  paragraph: { marginBottom: 8 },
  listItem: { marginBottom: 4, paddingLeft: 15 },
  signaturesHeader: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 24,
    marginBottom: 10,
    borderTop: "1 solid #ccc",
    paddingTop: 10,
  },
  sigRow: { fontSize: 9, marginBottom: 3 },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, fontSize: 8, color: "#999", textAlign: "center" },
});

export interface PdfAgreementData {
  ownerName: string;
  repoName: string | null;
  scope: string;
  version: number;
  text: string;
  generatedAt: Date;
}

export interface PdfSignatory {
  username: string;
  name: string | null;
  signedAt: Date;
  version: number;
}

function parseMarkdownBlocks(text: string): React.ReactElement[] {
  const lines = text.split("\n");
  const elements: React.ReactElement[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Headers
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      elements.push(React.createElement(Text, { key: `h3-${i}`, style: styles.h3 }, h3[1]));
      i++;
      continue;
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      elements.push(React.createElement(Text, { key: `h2-${i}`, style: styles.h2 }, h2[1]));
      i++;
      continue;
    }
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      elements.push(React.createElement(Text, { key: `h1-${i}`, style: styles.h1 }, h1[1]));
      i++;
      continue;
    }

    // List items
    const li = line.match(/^[-*]\s+(.+)/);
    if (li) {
      elements.push(
        React.createElement(Text, { key: `li-${i}`, style: styles.listItem }, `\u2022 ${li[1]}`),
      );
      i++;
      continue;
    }

    // Numbered list items
    const oli = line.match(/^\d+\.\s+(.+)/);
    if (oli) {
      elements.push(
        React.createElement(Text, { key: `oli-${i}`, style: styles.listItem }, line),
      );
      i++;
      continue;
    }

    // Regular paragraph — collect consecutive non-empty lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^#{1,3}\s/) && !lines[i].match(/^[-*]\s/) && !lines[i].match(/^\d+\.\s/)) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      const content = paraLines.join(" ")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/_(.+?)_/g, "$1");
      elements.push(
        React.createElement(Text, { key: `p-${i}`, style: styles.paragraph }, content),
      );
    }
  }

  return elements;
}

function buildDocument(
  agreement: PdfAgreementData,
  signatories?: PdfSignatory[],
) {
  const label = agreement.repoName
    ? `${agreement.ownerName}/${agreement.repoName}`
    : `${agreement.ownerName} (Org-wide)`;

  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, "Contributor License Agreement"),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${label}  \u2022  Version ${agreement.version}  \u2022  Generated ${agreement.generatedAt.toISOString().split("T")[0]}`,
        ),
      ),
      // CLA body
      ...parseMarkdownBlocks(agreement.text),
      // Signatories (optional)
      ...(signatories && signatories.length > 0
        ? [
            React.createElement(
              Text,
              { key: "sig-header", style: styles.signaturesHeader },
              `Signatories (${signatories.length})`,
            ),
            ...signatories.map((s, idx) =>
              React.createElement(
                Text,
                { key: `sig-${idx}`, style: styles.sigRow },
                `${s.username}${s.name ? ` (${s.name})` : ""}  \u2014  v${s.version}  \u2014  ${s.signedAt.toISOString().split("T")[0]}`,
              ),
            ),
          ]
        : []),
      // Footer
      React.createElement(
        Text,
        { style: styles.footer, fixed: true },
        `CLAHub  \u2022  ${label}`,
      ),
    ),
  );
}

export async function generateAgreementPdf(
  agreement: PdfAgreementData,
  signatories?: PdfSignatory[],
): Promise<Uint8Array> {
  const doc = buildDocument(agreement, signatories);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(doc as any);
}
