"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { revokeSignature } from "@/lib/actions/signature";

interface RevokeSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatureId: number;
  agreementId: number;
  nickname: string;
}

export function RevokeSignatureDialog({
  open,
  onOpenChange,
  signatureId,
  agreementId,
  nickname,
}: RevokeSignatureDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeSignature({ signatureId, agreementId });
      if (result.success) {
        toast.success(`Signature revoked for ${nickname}`);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke Signature</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke the CLA signature for{" "}
            <strong>{nickname}</strong>? Open pull requests will be re-checked
            and may fail the CLA status check.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
          >
            {isPending ? "Revoking..." : "Revoke"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
