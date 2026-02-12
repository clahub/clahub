"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addExclusion, removeExclusion } from "@/lib/actions/exclusion";
import { UserExclusionInput } from "./user-exclusion-input";
import { TeamExclusionSelect } from "./team-exclusion-select";

export type ExclusionData = {
  id: number;
  type: string;
  githubLogin: string | null;
  githubTeamSlug: string | null;
};

export function ExclusionManager({
  agreementId,
  ownerName,
  initialExclusions,
}: {
  agreementId: number;
  ownerName: string;
  initialExclusions: ExclusionData[];
}) {
  const [exclusions, setExclusions] = useState(initialExclusions);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const botAutoEnabled = exclusions.some((e) => e.type === "bot_auto");
  const userExclusions = exclusions.filter((e) => e.type === "user");
  const teamExclusions = exclusions.filter((e) => e.type === "team");

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
          window.location.reload();
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      }
    });
  }

  function handleAddUser(login: string) {
    setError(null);
    startTransition(async () => {
      const result = await addExclusion({
        agreementId,
        type: "user",
        githubLogin: login,
      });
      if (result.success) {
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

  function handleAddTeam(slug: string) {
    setError(null);
    startTransition(async () => {
      const result = await addExclusion({
        agreementId,
        type: "team",
        githubTeamSlug: slug,
      });
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function handleRemoveTeam(exclusionId: number) {
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
        <UserExclusionInput
          userExclusions={userExclusions}
          onAdd={handleAddUser}
          onRemove={handleRemoveUser}
          disabled={isPending}
        />

        {/* Team exclusions */}
        <TeamExclusionSelect
          ownerName={ownerName}
          teamExclusions={teamExclusions.map((e) => ({
            id: e.id,
            githubTeamSlug: e.githubTeamSlug,
          }))}
          onAdd={handleAddTeam}
          onRemove={handleRemoveTeam}
          disabled={isPending}
        />
      </CardContent>
    </Card>
  );
}
