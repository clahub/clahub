"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Ban, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { unrevokeSignature } from "@/lib/actions/signature";
import { RevokeSignatureDialog } from "./revoke-signature-dialog";

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
  agreementId?: number;
  isOwner?: boolean;
}

export function SignatoriesList({
  signatures,
  agreementId,
  isOwner,
}: SignatoriesListProps) {
  const active = signatures.filter((s) => !s.revokedAt);
  const revoked = signatures.filter((s) => s.revokedAt);

  const [revokeTarget, setRevokeTarget] = useState<Signatory | null>(null);
  const [isRestoring, startRestoreTransition] = useTransition();

  function handleRestore(sig: Signatory) {
    if (!agreementId) return;
    startRestoreTransition(async () => {
      const result = await unrevokeSignature({
        signatureId: sig.id,
        agreementId,
      });
      if (result.success) {
        toast.success(`Signature restored for ${sig.user.nickname}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            <span>
              Signatories ({active.length})
              {revoked.length > 0 && (
                <span className="text-muted-foreground ml-1 text-sm font-normal">
                  {revoked.length} revoked
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 && revoked.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No one has signed this agreement yet.
            </p>
          ) : (
            <>
              {active.length > 0 && (
                <ul className="divide-y">
                  {active.map((sig) => (
                    <li
                      key={sig.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
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
                      {isOwner && agreementId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(sig)}
                        >
                          <Ban className="mr-1 size-4" />
                          Revoke
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {revoked.length > 0 && (
                <>
                  {active.length > 0 && <Separator className="my-4" />}
                  <ul className="divide-y">
                    {revoked.map((sig) => (
                      <li
                        key={sig.id}
                        className="flex items-center gap-3 py-3 opacity-60 first:pt-0 last:pb-0"
                      >
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
                          <p className="truncate text-sm font-medium line-through">
                            {sig.user.nickname}
                          </p>
                          {sig.user.email && (
                            <p className="text-muted-foreground truncate text-xs">
                              {sig.user.email}
                            </p>
                          )}
                        </div>
                        <Badge variant="destructive">Revoked</Badge>
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {sig.signedAt.toLocaleDateString()}
                        </span>
                        {isOwner && agreementId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isRestoring}
                            onClick={() => handleRestore(sig)}
                          >
                            <RotateCcw className="mr-1 size-4" />
                            Restore
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {revokeTarget && agreementId && (
        <RevokeSignatureDialog
          open={!!revokeTarget}
          onOpenChange={(open) => !open && setRevokeTarget(null)}
          signatureId={revokeTarget.id}
          agreementId={agreementId}
          nickname={revokeTarget.user.nickname}
        />
      )}
    </>
  );
}
