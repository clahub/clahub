import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CsvPreviewRow {
  githubLogin?: string;
  email?: string;
  name?: string;
  signedAt?: string;
  valid: boolean;
  error?: string;
}

interface CsvImportPreviewProps {
  rows: CsvPreviewRow[];
  validCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CsvImportPreview({
  rows,
  validCount,
  onConfirm,
  onCancel,
  isPending,
}: CsvImportPreviewProps) {
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">GitHub</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => (
                <tr key={i} className={row.valid ? "" : "bg-destructive/5"}>
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">{row.githubLogin || "-"}</td>
                  <td className="px-3 py-2">{row.email || "-"}</td>
                  <td className="px-3 py-2">{row.name || "-"}</td>
                  <td className="px-3 py-2">{row.signedAt || "-"}</td>
                  <td className="px-3 py-2 text-center">
                    {row.valid ? (
                      <CheckCircle2 className="inline-block size-4 text-green-600" />
                    ) : (
                      <span className="inline-flex items-center gap-1" title={row.error}>
                        <XCircle className="size-4 text-destructive" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {validCount} valid{invalidCount > 0 ? `, ${invalidCount} invalid` : ""}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isPending || validCount === 0}
          >
            {isPending ? "Importing..." : `Import ${validCount} signatures`}
          </Button>
        </div>
      </div>
    </div>
  );
}
