"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { deleteAgreement } from "@/lib/actions/agreement";

interface DeleteAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: number;
  repoName: string;
}

export function DeleteAgreementDialog({
  open,
  onOpenChange,
  agreementId,
  repoName,
}: DeleteAgreementDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAgreement({ id: agreementId });
      if (result.success) {
        toast.success("Agreement deleted");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Agreement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the agreement for{" "}
            <strong>{repoName}</strong>? This action cannot be undone.
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
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
