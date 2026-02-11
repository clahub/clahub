"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  disabled,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="space-y-2">
      <div className="flex gap-1 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-b-2 border-transparent",
            tab === "write" && "border-primary"
          )}
          onClick={() => setTab("write")}
        >
          Write
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-b-2 border-transparent",
            tab === "preview" && "border-primary"
          )}
          onClick={() => setTab("preview")}
        >
          Preview
        </Button>
      </div>

      {tab === "write" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Write your CLA text in Markdown..."
          className="min-h-[300px] font-mono text-sm"
        />
      ) : (
        <div className="prose dark:prose-invert max-w-none rounded-md border p-4">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
