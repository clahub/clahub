export type BadgeStyle = "flat" | "flat-square";

export interface BadgeOptions {
  label: string;
  message: string;
  color: string;
  style: BadgeStyle;
}

// Verdana 11px character-width table (shields.io standard)
const CHAR_WIDTHS: Record<string, number> = {
  " ": 3.3,
  "!": 3.65,
  '"': 4.75,
  "#": 7.55,
  $: 6.05,
  "%": 8.55,
  "&": 7.25,
  "'": 2.55,
  "(": 3.95,
  ")": 3.95,
  "*": 5.55,
  "+": 7.55,
  ",": 3.35,
  "-": 3.95,
  ".": 3.35,
  "/": 4.35,
  "0": 6.45,
  "1": 4.75,
  "2": 6.05,
  "3": 6.05,
  "4": 6.45,
  "5": 6.05,
  "6": 6.25,
  "7": 5.55,
  "8": 6.35,
  "9": 6.25,
  ":": 3.35,
  ";": 3.35,
  "<": 7.55,
  "=": 7.55,
  ">": 7.55,
  "?": 5.35,
  "@": 10.0,
  A: 7.25,
  B: 6.65,
  C: 6.65,
  D: 7.25,
  E: 6.05,
  F: 5.55,
  G: 7.35,
  H: 7.25,
  I: 3.65,
  J: 4.35,
  K: 6.65,
  L: 5.55,
  M: 8.35,
  N: 7.25,
  O: 7.55,
  P: 6.05,
  Q: 7.55,
  R: 6.65,
  S: 6.25,
  T: 5.75,
  U: 7.25,
  V: 6.65,
  W: 9.75,
  X: 6.15,
  Y: 5.75,
  Z: 6.45,
  "[": 3.95,
  "\\": 4.35,
  "]": 3.95,
  "^": 7.55,
  _: 5.55,
  "`": 5.55,
  a: 5.85,
  b: 6.35,
  c: 5.05,
  d: 6.35,
  e: 5.75,
  f: 3.55,
  g: 5.85,
  h: 6.35,
  i: 2.85,
  j: 3.15,
  k: 5.75,
  l: 2.85,
  m: 9.35,
  n: 6.35,
  o: 6.15,
  p: 6.35,
  q: 6.35,
  r: 4.35,
  s: 5.05,
  t: 3.95,
  u: 6.35,
  v: 5.55,
  w: 8.15,
  x: 5.55,
  y: 5.55,
  z: 5.05,
  "{": 5.55,
  "|": 3.95,
  "}": 5.55,
  "~": 7.55,
};

const DEFAULT_CHAR_WIDTH = 6.5;

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function measureText(text: string): number {
  let width = 0;
  for (const ch of text) {
    width += CHAR_WIDTHS[ch] ?? DEFAULT_CHAR_WIDTH;
  }
  return width;
}

export function renderBadge(options: BadgeOptions): string {
  const { label, message, color, style } = options;

  const labelWidth = measureText(label) + 10;
  const messageWidth = measureText(message) + 10;
  const totalWidth = labelWidth + messageWidth;

  // 10x coordinates for sub-pixel precision
  const s = (v: number) => Math.round(v * 10);
  const sTotal = s(totalWidth);
  const sLabel = s(labelWidth);
  const sMessage = s(messageWidth);

  const escapedLabel = escapeXml(label);
  const escapedMessage = escapeXml(message);
  const ariaLabel = escapeXml(`${label}: ${message}`);

  const rx = style === "flat-square" ? 0 : 3;

  const gradient =
    style === "flat"
      ? `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`
      : "";

  const gradientRect =
    style === "flat"
      ? `<rect width="${sTotal}" height="200" fill="url(#s)"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20" role="img" aria-label="${ariaLabel}"><title>${ariaLabel}</title>${gradient}<clipPath id="r"><rect width="${sTotal}" height="200" rx="${s(rx)}" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${sLabel}" height="200" fill="#555"/><rect x="${sLabel}" width="${sMessage}" height="200" fill="#${escapeXml(color)}"/>${gradientRect}</g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="${s(labelWidth / 2)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${s(labelWidth - 10)}">${escapedLabel}</text><text x="${s(labelWidth / 2)}" y="140" transform="scale(.1)" fill="#fff" textLength="${s(labelWidth - 10)}">${escapedLabel}</text><text aria-hidden="true" x="${s(labelWidth + messageWidth / 2)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${s(messageWidth - 10)}">${escapedMessage}</text><text x="${s(labelWidth + messageWidth / 2)}" y="140" transform="scale(.1)" fill="#fff" textLength="${s(messageWidth - 10)}">${escapedMessage}</text></g></svg>`;
}
