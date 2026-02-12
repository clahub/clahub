"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createApiKey, revokeApiKey } from "@/lib/actions/api-key";
import type { ApiKeyInfo } from "@/lib/actions/api-key";

interface Props {
  keys: ApiKeyInfo[];
}

export function ApiKeyManager({ keys }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createApiKey({ name });
      if (result.success && result.rawKey) {
        setNewKey(result.rawKey);
        setName("");
        router.refresh();
        toast.success("API key created");
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  function handleRevoke() {
    if (revokeId === null) return;
    startTransition(async () => {
      const result = await revokeApiKey({ id: revokeId });
      if (result.success) {
        setRevokeId(null);
        router.refresh();
        toast.success("API key revoked");
      } else {
        toast.error(result.error);
      }
    });
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(date: string | Date | null) {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      {/* Create Key Dialog */}
      <Dialog
        open={createOpen || !!newKey}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setNewKey(null);
            setName("");
          } else {
            setCreateOpen(true);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent>
          {newKey ? (
            <>
              <DialogHeader>
                <DialogTitle>API Key Created</DialogTitle>
                <DialogDescription>
                  Copy your API key now. You won&apos;t be able to see it again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <code className="bg-muted flex-1 rounded px-3 py-2 text-sm break-all">
                  {newKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newKey)}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setNewKey(null);
                    setCreateOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Give your key a name to identify it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., CI/CD Pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) handleCreate();
                  }}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={!name.trim() || isPending}
                >
                  Create
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Any integrations using this key will
              stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isPending}
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Key List */}
      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <KeyRound className="text-muted-foreground mb-4 size-12" />
          <h2 className="text-xl font-semibold">No API keys</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Create an API key to access the CLAHub API programmatically.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Last Used</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-muted-foreground text-xs">
                      {key.keyPrefix}...
                    </code>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatDate(key.createdAt)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatDate(key.lastUsedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {key.revokedAt ? (
                      <Badge variant="secondary">Revoked</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!key.revokedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeId(key.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
