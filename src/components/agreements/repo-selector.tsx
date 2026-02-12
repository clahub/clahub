"use client";

import type { Installation } from "@/lib/actions/agreement";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RepoSelection =
  | {
      scope: "repo";
      githubRepoId: string;
      ownerName: string;
      repoName: string;
      installationId: string;
    }
  | {
      scope: "org";
      githubOrgId: string;
      ownerName: string;
      installationId: string;
    };

interface RepoSelectorProps {
  installations: Installation[];
  onSelect: (selection: RepoSelection) => void;
  disabled?: boolean;
}

export function RepoSelector({
  installations,
  onSelect,
  disabled,
}: RepoSelectorProps) {
  return (
    <Select
      disabled={disabled}
      onValueChange={(value) => {
        if (value.startsWith("org:")) {
          // value format: "org:installationId:accountId:ownerName"
          const [, installationId, githubOrgId, ownerName] = value.split(":");
          onSelect({ scope: "org", githubOrgId, ownerName, installationId });
        } else {
          // value format: "repo:installationId:repoId:owner:name"
          const [, installationId, githubRepoId, ownerName, repoName] =
            value.split(":");
          onSelect({
            scope: "repo",
            githubRepoId,
            ownerName,
            repoName,
            installationId,
          });
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a repository or organization" />
      </SelectTrigger>
      <SelectContent>
        {installations.length === 0 && (
          <SelectItem value="__none" disabled>
            No installations found. Install the GitHub App first.
          </SelectItem>
        )}
        {installations.map((inst) => (
          <SelectGroup key={inst.id}>
            <SelectLabel>{inst.account}</SelectLabel>
            {inst.accountType === "Organization" && (
              <>
                <SelectItem
                  value={`org:${inst.id}:${inst.accountId}:${inst.account}`}
                >
                  Entire organization ({inst.account})
                </SelectItem>
                <SelectSeparator />
              </>
            )}
            {inst.repos.map((repo) => (
              <SelectItem
                key={repo.id}
                value={`repo:${inst.id}:${repo.id}:${repo.owner}:${repo.name}`}
              >
                {repo.fullName}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
