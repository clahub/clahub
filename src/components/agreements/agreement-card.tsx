"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteAgreementDialog } from "./delete-agreement-dialog";

interface AgreementCardProps {
  id: number;
  scope: string;
  ownerName: string;
  repoName: string | null;
  signatureCount: number;
  version: number;
  createdAt: Date;
}

export function AgreementCard({
  id,
  scope,
  ownerName,
  repoName,
  signatureCount,
  version,
  createdAt,
}: AgreementCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const displayName = repoName ? `${ownerName}/${repoName}` : ownerName;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="truncate">{displayName}</CardTitle>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/agreements/edit/${id}`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {scope === "org" && <Badge>Org-wide</Badge>}
            <Badge variant="secondary">v{version}</Badge>
            <Badge variant="outline">
              {signatureCount} {signatureCount === 1 ? "signature" : "signatures"}
            </Badge>
            <span className="text-muted-foreground ml-auto text-xs">
              {createdAt.toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <DeleteAgreementDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        agreementId={id}
        repoName={displayName}
      />
    </>
  );
}
