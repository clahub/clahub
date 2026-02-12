import { SiteHeader } from "@/components/site-header";

export default function AgreementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <div className="container px-4 py-8 md:px-6">{children}</div>
      </main>
    </div>
  );
}
