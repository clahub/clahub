import Image from "next/image";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Signatory {
  id: number;
  signedAt: Date;
  revokedAt: Date | null;
  user: {
    nickname: string;
    email: string | null;
    avatarUrl: string | null;
  };
  version: {
    version: number;
  };
}

interface SignatoriesListProps {
  signatures: Signatory[];
}

export function SignatoriesList({ signatures }: SignatoriesListProps) {
  const active = signatures.filter((s) => !s.revokedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          Signatories ({active.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No one has signed this agreement yet.
          </p>
        ) : (
          <ul className="divide-y">
            {active.map((sig) => (
              <li key={sig.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {sig.user.avatarUrl ? (
                  <Image
                    src={sig.user.avatarUrl}
                    alt={sig.user.nickname}
                    width={32}
                    height={32}
                    className="size-8 rounded-full"
                  />
                ) : (
                  <div className="bg-muted size-8 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {sig.user.nickname}
                  </p>
                  {sig.user.email && (
                    <p className="text-muted-foreground truncate text-xs">
                      {sig.user.email}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">v{sig.version.version}</Badge>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {sig.signedAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
