"use client";

import type { Installation } from "@/lib/actions/agreement";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RepoSelectorProps {
  installations: Installation[];
  onSelect: (repo: {
    githubRepoId: string;
    ownerName: string;
    repoName: string;
    installationId: string;
  }) => void;
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
        // value format: "installationId:repoId:owner:name"
        const [installationId, githubRepoId, ownerName, repoName] =
          value.split(":");
        onSelect({ githubRepoId, ownerName, repoName, installationId });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a repository" />
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
            {inst.repos.map((repo) => (
              <SelectItem
                key={repo.id}
                value={`${inst.id}:${repo.id}:${repo.owner}:${repo.name}`}
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
