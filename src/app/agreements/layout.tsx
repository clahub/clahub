import { SiteHeader } from "@/components/site-header";
import { getBranding } from "@/lib/branding";

export default function AgreementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appName, logoUrl } = getBranding();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader appName={appName} logoUrl={logoUrl} />
      <main id="main-content" className="flex-1">
        <div className="container px-4 py-8 md:px-6">{children}</div>
      </main>
    </div>
  );
}
