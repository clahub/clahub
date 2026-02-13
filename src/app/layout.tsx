import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { getBranding } from "@/lib/branding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.APP_NAME || "CLAHub";

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description:
    "Manage Contributor License Agreements for your GitHub projects. Automate CLA signing with GitHub Checks integration.",
  icons: {
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: appName,
    description:
      "Manage Contributor License Agreements for your GitHub projects.",
    siteName: appName,
    type: "website",
    images: [{ url: "/cla-logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { primaryColor } = getBranding();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        primaryColor
          ? ({ "--primary": primaryColor } as React.CSSProperties)
          : undefined
      }
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
