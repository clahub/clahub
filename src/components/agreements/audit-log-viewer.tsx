"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Download, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getAuditLogs,
	exportAuditLogsJson,
	type AuditLogEntry,
} from "@/lib/actions/audit-log";

interface AuditLogViewerProps {
	agreementId: number;
}

const ACTION_OPTIONS = [
	{ value: "", label: "All actions" },
	{ value: "agreement.create", label: "Create" },
	{ value: "agreement.update", label: "Update" },
	{ value: "agreement.delete", label: "Delete" },
	{ value: "agreement.transfer", label: "Transfer" },
	{ value: "signature.sign", label: "Sign" },
	{ value: "signature.revoke", label: "Revoke" },
	{ value: "signature.restore", label: "Restore" },
	{ value: "exclusion.create", label: "Exclusion add" },
	{ value: "exclusion.delete", label: "Exclusion remove" },
];

export function AuditLogViewer({ agreementId }: AuditLogViewerProps) {
	const [entries, setEntries] = useState<AuditLogEntry[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [actionFilter, setActionFilter] = useState("");
	const [expanded, setExpanded] = useState<Set<number>>(new Set());
	const [isPending, startTransition] = useTransition();
	const pageSize = 10;

	const fetchLogs = useCallback(() => {
		startTransition(async () => {
			const result = await getAuditLogs({
				agreementId,
				page,
				pageSize,
				actionFilter: actionFilter || undefined,
			});
			setEntries(result.entries);
			setTotal(result.total);
		});
	}, [agreementId, page, actionFilter]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	function toggleRow(id: number) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function handleExport() {
		startTransition(async () => {
			const result = await exportAuditLogsJson({ agreementId });
			if (!result.success) return;
			const blob = new Blob([result.data], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `audit-log-${agreementId}.json`;
			a.click();
			URL.revokeObjectURL(url);
		});
	}

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<ScrollText className="h-5 w-5" />
							Audit Log
						</CardTitle>
						<CardDescription>
							History of all changes to this agreement.
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						disabled={isPending || total === 0}
					>
						<Download className="mr-2 h-4 w-4" />
						Export JSON
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div>
					<select
						className="rounded-md border px-3 py-1.5 text-sm"
						value={actionFilter}
						onChange={(e) => {
							setActionFilter(e.target.value);
							setPage(1);
						}}
					>
						{ACTION_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{entries.length === 0 && !isPending ? (
					<p className="text-sm text-muted-foreground">No audit log entries.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-muted-foreground">
									<th className="w-8 pb-2" />
									<th className="pb-2">Date</th>
									<th className="pb-2">User</th>
									<th className="pb-2">Action</th>
								</tr>
							</thead>
							<tbody>
								{entries.map((entry) => (
									<AuditRow
										key={entry.id}
										entry={entry}
										isExpanded={expanded.has(entry.id)}
										onToggle={() => toggleRow(entry.id)}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}

				{totalPages > 1 && (
					<div className="flex items-center justify-between pt-2">
						<span className="text-xs text-muted-foreground">
							Page {page} of {totalPages} ({total} entries)
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1 || isPending}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page >= totalPages || isPending}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AuditRow({
	entry,
	isExpanded,
	onToggle,
}: {
	entry: AuditLogEntry;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const hasDetails = entry.before || entry.after;

	return (
		<>
			<tr
				className={`border-b ${hasDetails ? "cursor-pointer hover:bg-muted/50" : ""}`}
				onClick={hasDetails ? onToggle : undefined}
			>
				<td className="py-2">
					{hasDetails &&
						(isExpanded ? (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						))}
				</td>
				<td className="py-2 whitespace-nowrap">
					{new Date(entry.createdAt).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</td>
				<td className="py-2">{entry.user?.nickname ?? "system"}</td>
				<td className="py-2 font-mono text-xs">{entry.action}</td>
			</tr>
			{isExpanded && hasDetails && (
				<tr className="border-b">
					<td />
					<td colSpan={3} className="py-2">
						<div className="grid gap-2 text-xs">
							{entry.before && (
								<div>
									<span className="font-semibold text-red-600">Before:</span>
									<pre className="mt-1 overflow-x-auto rounded bg-muted p-2">
										{formatJson(entry.before)}
									</pre>
								</div>
							)}
							{entry.after && (
								<div>
									<span className="font-semibold text-green-600">After:</span>
									<pre className="mt-1 overflow-x-auto rounded bg-muted p-2">
										{formatJson(entry.after)}
									</pre>
								</div>
							)}
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

function formatJson(raw: string): string {
	try {
		return JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return raw;
	}
}
