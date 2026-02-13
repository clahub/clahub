import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getBranding } from "@/lib/branding";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appName, logoUrl } = getBranding();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader appName={appName} logoUrl={logoUrl} />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter appName={appName} />
    </div>
  );
}
