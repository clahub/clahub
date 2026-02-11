import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center gap-4 px-4 py-6 text-sm md:flex-row md:justify-between md:px-6">
        <p className="text-muted-foreground">
          &copy; {new Date().getFullYear()} CLAHub. All rights reserved.
        </p>
        <nav className="text-muted-foreground flex gap-4">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <a
            href="https://github.com/clahub/clahub"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
