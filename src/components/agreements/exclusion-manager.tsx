"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addExclusion, removeExclusion } from "@/lib/actions/exclusion";

export type ExclusionData = {
  id: number;
  type: string;
  githubLogin: string | null;
};

export function ExclusionManager({
  agreementId,
  initialExclusions,
}: {
  agreementId: number;
  initialExclusions: ExclusionData[];
}) {
  const [exclusions, setExclusions] = useState(initialExclusions);
  const [loginInput, setLoginInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const botAutoEnabled = exclusions.some((e) => e.type === "bot_auto");
  const userExclusions = exclusions.filter((e) => e.type === "user");

  function handleToggleBotAuto() {
    setError(null);
    startTransition(async () => {
      if (botAutoEnabled) {
        const botExclusion = exclusions.find((e) => e.type === "bot_auto");
        if (!botExclusion) return;
        const result = await removeExclusion({
          id: botExclusion.id,
          agreementId,
        });
        if (result.success) {
          setExclusions((prev) => prev.filter((e) => e.id !== botExclusion.id));
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      } else {
        const result = await addExclusion({
          agreementId,
          type: "bot_auto",
        });
        if (result.success) {
          // Optimistic: we don't know the new ID, so reload
          window.location.reload();
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      }
    });
  }

  function handleAddUser() {
    const login = loginInput.trim();
    if (!login) return;
    setError(null);
    startTransition(async () => {
      const result = await addExclusion({
        agreementId,
        type: "user",
        githubLogin: login,
      });
      if (result.success) {
        setLoginInput("");
        window.location.reload();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function handleRemoveUser(exclusionId: number) {
    setError(null);
    startTransition(async () => {
      const result = await removeExclusion({
        id: exclusionId,
        agreementId,
      });
      if (result.success) {
        setExclusions((prev) => prev.filter((e) => e.id !== exclusionId));
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CLA Exclusions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Bot auto-detection toggle */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="bot-auto"
            checked={botAutoEnabled}
            onCheckedChange={handleToggleBotAuto}
            disabled={isPending}
          />
          <Label htmlFor="bot-auto" className="text-sm">
            Auto-exclude bot accounts{" "}
            <span className="text-muted-foreground">
              (e.g. dependabot[bot], renovate[bot])
            </span>
          </Label>
        </div>

        {/* User exclusions */}
        <div className="space-y-3">
          <p className="text-sm font-medium">User exclusions</p>

          <div className="flex gap-2">
            <Input
              placeholder="GitHub username"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUser();
                }
              }}
              disabled={isPending}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUser}
              disabled={isPending || !loginInput.trim()}
            >
              Add
            </Button>
          </div>

          {userExclusions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {userExclusions.map((ex) => (
                <Badge key={ex.id} variant="secondary" className="gap-1.5">
                  {ex.githubLogin}
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(ex.id)}
                    disabled={isPending}
                    className="ml-0.5 hover:text-destructive"
                    aria-label={`Remove ${ex.githubLogin}`}
                  >
                    &times;
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {userExclusions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No user exclusions configured.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
