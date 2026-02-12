"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Suggestion = { login: string; avatarUrl: string };

export type ExclusionItem = { id: number; githubLogin: string | null };

export function UserExclusionInput({
  userExclusions,
  onAdd,
  onRemove,
  disabled,
}: {
  userExclusions: ExclusionItem[];
  onAdd: (login: string) => void;
  onRemove: (id: number) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/github/search-users?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.items ?? []);
          setShowDropdown(true);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(login: string) {
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
    onAdd(login);
  }

  function handleSubmit() {
    const login = input.trim();
    if (!login) return;
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
    onAdd(login);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">User exclusions</p>

      <div className="relative" ref={wrapperRef}>
        <div className="flex gap-2">
          <Input
            placeholder="GitHub username"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === "Escape") {
                setShowDropdown(false);
              }
            }}
            disabled={disabled}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
          >
            Add
          </Button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-w-xs rounded-md border bg-popover shadow-md">
            {suggestions.map((s) => (
              <button
                key={s.login}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => handleSelect(s.login)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.avatarUrl}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
                {s.login}
              </button>
            ))}
          </div>
        )}
      </div>

      {userExclusions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {userExclusions.map((ex) => (
            <Badge key={ex.id} variant="secondary" className="gap-1.5">
              {ex.githubLogin}
              <button
                type="button"
                onClick={() => onRemove(ex.id)}
                disabled={disabled}
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
  );
}
