import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SignedBannerProps {
  signedAt: Date;
  version: number;
  referrer: string | null;
}

export function SignedBanner({ signedAt, version, referrer }: SignedBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
      <div className="flex items-center gap-2">
        <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
        <span className="font-medium text-green-800 dark:text-green-200">
          You have already signed this agreement
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-green-700 dark:text-green-300">
        <span>Signed on {signedAt.toLocaleDateString()}</span>
        <Badge variant="secondary">v{version}</Badge>
      </div>
      {referrer && (
        <Button asChild variant="outline" size="sm" className="w-fit">
          <a href={referrer}>Return to Pull Request</a>
        </Button>
      )}
    </div>
  );
}
