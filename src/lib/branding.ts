export interface Branding {
  appName: string;
  logoUrl: string;
  primaryColor: string | undefined;
}

export function getBranding(): Branding {
  return {
    appName: process.env.APP_NAME || "CLAHub",
    logoUrl: process.env.APP_LOGO_URL || "/cla-logo.png",
    primaryColor: process.env.APP_PRIMARY_COLOR || undefined,
  };
}
