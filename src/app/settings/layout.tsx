import { SiteHeader } from "@/components/site-header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">{children}</div>
      </main>
    </div>
  );
}
