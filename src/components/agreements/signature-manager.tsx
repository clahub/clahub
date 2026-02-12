"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useTransition,
  type ChangeEvent,
} from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addManualSignature,
  importCsvSignatures,
} from "@/lib/actions/signature";
import { csvSignatureRowSchema } from "@/lib/schemas/signature";
import { CsvImportPreview, type CsvPreviewRow } from "./csv-import-preview";

type Suggestion = { login: string; avatarUrl: string };

// Column header aliases for CSV auto-detection
const COLUMN_MAP: Record<string, string> = {
  github: "githubLogin",
  github_username: "githubLogin",
  github_login: "githubLogin",
  githublogin: "githubLogin",
  username: "githubLogin",
  login: "githubLogin",
  email: "email",
  email_address: "email",
  emailaddress: "email",
  name: "name",
  full_name: "name",
  fullname: "name",
  date: "signedAt",
  date_signed: "signedAt",
  signed_at: "signedAt",
  signed_date: "signedAt",
  signedat: "signedAt",
  signeddate: "signedAt",
};

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return COLUMN_MAP[key] ?? key;
}

export function SignatureManager({
  agreementId,
}: {
  agreementId: number;
}) {
  const [mode, setMode] = useState<"github" | "email">("github");
  const [githubInput, setGithubInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvPreviewRow[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/github/search-users?q=${encodeURIComponent(q)}`,
        );
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
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function resetManualForm() {
    setGithubInput("");
    setEmailInput("");
    setNameInput("");
    setDateInput("");
    setSuggestions([]);
    setShowDropdown(false);
  }

  function handleSelectSuggestion(login: string) {
    setGithubInput(login);
    setSuggestions([]);
    setShowDropdown(false);
  }

  function handleAddSignature() {
    startTransition(async () => {
      const result = await addManualSignature({
        agreementId,
        ...(mode === "github"
          ? { githubLogin: githubInput.trim() }
          : { email: emailInput.trim(), name: nameInput.trim() || undefined }),
        ...(dateInput ? { signedAt: new Date(dateInput).toISOString() } : {}),
      });

      if (result.success) {
        toast.success("Signature added successfully");
        resetManualForm();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows: CsvPreviewRow[] = (
          results.data as Record<string, string>[]
        ).map((raw) => {
          // Normalize column headers
          const mapped: Record<string, string> = {};
          for (const [key, value] of Object.entries(raw)) {
            const normalized = normalizeHeader(key);
            if (value?.trim()) {
              mapped[normalized] = value.trim();
            }
          }

          const row = {
            githubLogin: mapped.githubLogin,
            email: mapped.email,
            name: mapped.name,
            signedAt: mapped.signedAt,
          };

          const validation = csvSignatureRowSchema.safeParse(row);
          return {
            ...row,
            valid: validation.success,
            error: validation.success
              ? undefined
              : validation.error.issues[0]?.message,
          };
        });

        setCsvRows(rows);
      },
      error() {
        toast.error("Failed to parse CSV file");
      },
    });

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleConfirmImport() {
    if (!csvRows) return;

    const validRows = csvRows
      .filter((r) => r.valid)
      .map(({ githubLogin, email, name, signedAt }) => ({
        githubLogin,
        email,
        name,
        signedAt: signedAt
          ? new Date(signedAt).toISOString()
          : undefined,
      }));

    startTransition(async () => {
      const result = await importCsvSignatures({
        agreementId,
        rows: validRows,
      });

      if (result.success) {
        const parts: string[] = [];
        if (result.imported > 0) parts.push(`${result.imported} imported`);
        if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
        if (result.errors.length > 0)
          parts.push(`${result.errors.length} errors`);
        toast.success(`CSV import complete: ${parts.join(", ")}`);
        setCsvRows(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  const canSubmit =
    mode === "github" ? githubInput.trim().length > 0 : emailInput.trim().length > 0;
  const validCsvCount = csvRows?.filter((r) => r.valid).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Entry Section */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Manual entry</p>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "github" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("github")}
            >
              GitHub username
            </Button>
            <Button
              type="button"
              variant={mode === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("email")}
            >
              Email
            </Button>
          </div>

          {mode === "github" ? (
            <div className="relative" ref={wrapperRef}>
              <div className="flex gap-2">
                <Input
                  placeholder="GitHub username"
                  value={githubInput}
                  onChange={(e) => {
                    setGithubInput(e.target.value);
                    fetchSuggestions(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canSubmit) handleAddSignature();
                    }
                    if (e.key === "Escape") setShowDropdown(false);
                  }}
                  disabled={isPending}
                  className="max-w-xs"
                />
              </div>

              {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-w-xs rounded-md border bg-popover shadow-md">
                  {suggestions.map((s) => (
                    <button
                      key={s.login}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => handleSelectSuggestion(s.login)}
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
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="sig-email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="sig-email"
                  type="email"
                  placeholder="user@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canSubmit) handleAddSignature();
                    }
                  }}
                  disabled={isPending}
                  className="mt-1 max-w-xs"
                />
              </div>
              <div>
                <Label htmlFor="sig-name" className="text-sm">
                  Name (optional)
                </Label>
                <Input
                  id="sig-name"
                  placeholder="Full name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={isPending}
                  className="mt-1 max-w-xs"
                />
              </div>
            </div>
          )}

          {/* Optional date */}
          <div>
            <Label htmlFor="sig-date" className="text-sm">
              Signed date (optional, defaults to today)
            </Label>
            <Input
              id="sig-date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              disabled={isPending}
              className="mt-1 max-w-xs"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddSignature}
            disabled={isPending || !canSubmit}
          >
            {isPending ? "Adding..." : "Add Signature"}
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* CSV Import Section */}
        <div className="space-y-4">
          <p className="text-sm font-medium">CSV import</p>
          <p className="text-sm text-muted-foreground">
            Upload a CSV with columns: github_username, email, name, date_signed
          </p>

          {!csvRows ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose CSV file
              </Button>
            </div>
          ) : (
            <CsvImportPreview
              rows={csvRows}
              validCount={validCsvCount}
              onConfirm={handleConfirmImport}
              onCancel={() => setCsvRows(null)}
              isPending={isPending}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
