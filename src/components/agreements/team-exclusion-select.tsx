"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Team = { slug: string; name: string; description: string | null };

export type TeamExclusionItem = {
  id: number;
  githubTeamSlug: string | null;
};

export function TeamExclusionSelect({
  ownerName,
  teamExclusions,
  onAdd,
  onRemove,
  disabled,
}: {
  ownerName: string;
  teamExclusions: TeamExclusionItem[];
  onAdd: (slug: string) => void;
  onRemove: (id: number) => void;
  disabled: boolean;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchTeams() {
      try {
        const res = await fetch(`/api/github/org-teams?org=${encodeURIComponent(ownerName)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTeams(data.teams ?? []);
        }
      } catch {
        // personal accounts or errors — leave empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTeams();
    return () => { cancelled = true; };
  }, [ownerName]);

  const excludedSlugs = new Set(teamExclusions.map((e) => e.githubTeamSlug));
  const availableTeams = teams.filter((t) => !excludedSlugs.has(t.slug));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Team exclusions</p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading teams...</p>
      ) : availableTeams.length > 0 ? (
        <Select
          onValueChange={(slug) => onAdd(slug)}
          disabled={disabled}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select a team to exclude" />
          </SelectTrigger>
          <SelectContent>
            {availableTeams.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.name}
                {t.description && (
                  <span className="ml-2 text-muted-foreground">
                    — {t.description}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No teams available
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          All teams already excluded
        </p>
      )}

      {teamExclusions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {teamExclusions.map((ex) => (
            <Badge key={ex.id} variant="secondary" className="gap-1.5">
              {ex.githubTeamSlug}
              <button
                type="button"
                onClick={() => onRemove(ex.id)}
                disabled={disabled}
                className="ml-0.5 hover:text-destructive"
                aria-label={`Remove team ${ex.githubTeamSlug}`}
              >
                &times;
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
