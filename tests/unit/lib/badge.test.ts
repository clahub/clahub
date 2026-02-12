import { describe, it, expect } from "vitest";
import {
  measureText,
  renderBadge,
  escapeXml,
  type BadgeOptions,
} from "@/lib/badge";

describe("escapeXml", () => {
  it("escapes HTML/XML special characters", () => {
    expect(escapeXml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  it("escapes single quotes", () => {
    expect(escapeXml("it's")).toBe("it&#39;s");
  });

  it("returns plain text unchanged", () => {
    expect(escapeXml("hello")).toBe("hello");
  });
});

describe("measureText", () => {
  it("returns 0 for empty string", () => {
    expect(measureText("")).toBe(0);
  });

  it("returns reasonable width for known text", () => {
    const width = measureText("CLA");
    expect(width).toBeGreaterThan(10);
    expect(width).toBeLessThan(30);
  });

  it("uses default width for unknown characters", () => {
    const width = measureText("\u00e9");
    expect(width).toBe(6.5);
  });

  it("sums character widths correctly", () => {
    const abWidth = measureText("ab");
    const aWidth = measureText("a");
    const bWidth = measureText("b");
    expect(abWidth).toBeCloseTo(aWidth + bWidth, 5);
  });
});

describe("renderBadge", () => {
  const defaults: BadgeOptions = {
    label: "CLA",
    message: "active",
    color: "4c1",
    style: "flat",
  };

  it("returns valid SVG", () => {
    const svg = renderBadge(defaults);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("includes aria-label for accessibility", () => {
    const svg = renderBadge(defaults);
    expect(svg).toContain('aria-label="CLA: active"');
  });

  it("includes title element", () => {
    const svg = renderBadge(defaults);
    expect(svg).toContain("<title>CLA: active</title>");
  });

  it("flat style includes linearGradient", () => {
    const svg = renderBadge({ ...defaults, style: "flat" });
    expect(svg).toContain("linearGradient");
  });

  it("flat-square style has no gradient and rx=0", () => {
    const svg = renderBadge({ ...defaults, style: "flat-square" });
    expect(svg).not.toContain("linearGradient");
    expect(svg).toContain('rx="0"');
  });

  it("applies the specified color", () => {
    const svg = renderBadge({ ...defaults, color: "e05d44" });
    expect(svg).toContain('fill="#e05d44"');
  });

  it("escapes XSS in label", () => {
    const svg = renderBadge({
      ...defaults,
      label: '<script>alert("xss")</script>',
    });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("escapes XSS in message", () => {
    const svg = renderBadge({
      ...defaults,
      message: '<img onerror="alert(1)">',
    });
    expect(svg).not.toContain("<img");
    expect(svg).toContain("&lt;img");
  });

  it("uses correct label and message text", () => {
    const svg = renderBadge({
      ...defaults,
      label: "License",
      message: "5 signed",
    });
    expect(svg).toContain("License");
    expect(svg).toContain("5 signed");
  });

  it("sets width and height attributes", () => {
    const svg = renderBadge(defaults);
    expect(svg).toMatch(/width="\d+(\.\d+)?"/);
    expect(svg).toContain('height="20"');
  });
});
