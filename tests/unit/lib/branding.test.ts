import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBranding } from "@/lib/branding";

describe("getBranding", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.APP_NAME;
    delete process.env.APP_LOGO_URL;
    delete process.env.APP_PRIMARY_COLOR;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns defaults when no env vars are set", () => {
    const branding = getBranding();
    expect(branding.appName).toBe("CLAHub");
    expect(branding.logoUrl).toBe("/cla-logo.png");
    expect(branding.primaryColor).toBeUndefined();
  });

  it("reads custom values from env", () => {
    process.env.APP_NAME = "MyCLA";
    process.env.APP_LOGO_URL = "https://example.com/logo.png";
    process.env.APP_PRIMARY_COLOR = "#ff6600";

    const branding = getBranding();
    expect(branding.appName).toBe("MyCLA");
    expect(branding.logoUrl).toBe("https://example.com/logo.png");
    expect(branding.primaryColor).toBe("#ff6600");
  });

  it("returns undefined primaryColor when not set", () => {
    process.env.APP_NAME = "MyCLA";
    const branding = getBranding();
    expect(branding.primaryColor).toBeUndefined();
  });
});
