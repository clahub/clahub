"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { transferAgreement } from "@/lib/actions/agreement";

type Suggestion = { login: string; avatarUrl: string };

interface TransferAgreementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	agreementId: number;
	agreementName: string;
}

export function TransferAgreementDialog({
	open,
	onOpenChange,
	agreementId,
	agreementName,
}: TransferAgreementDialogProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [input, setInput] = useState("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [selected, setSelected] = useState<Suggestion | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

	function handleOpenChange(next: boolean) {
		if (!next) {
			setInput("");
			setSuggestions([]);
			setShowDropdown(false);
			setSelected(null);
		}
		onOpenChange(next);
	}

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

	function handleSelect(user: Suggestion) {
		setSelected(user);
		setInput("");
		setSuggestions([]);
		setShowDropdown(false);
	}

	function handleTransfer() {
		if (!selected) return;
		startTransition(async () => {
			const result = await transferAgreement({
				agreementId,
				newOwnerLogin: selected.login,
			});
			if (result.success) {
				toast.success(`Ownership transferred to ${selected.login}`);
				handleOpenChange(false);
				router.push("/agreements");
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Transfer Ownership</DialogTitle>
					<DialogDescription>
						Transfer <strong>{agreementName}</strong> to another CLAHub owner.
						You will lose administrative access to this agreement.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{selected ? (
						<div className="flex items-center gap-3 rounded-md border p-3">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={selected.avatarUrl}
								alt=""
								className="h-8 w-8 rounded-full"
							/>
							<div className="flex-1 text-sm font-medium">{selected.login}</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setSelected(null)}
								disabled={isPending}
							>
								Change
							</Button>
						</div>
					) : (
						<div className="relative" ref={wrapperRef}>
							<Input
								placeholder="Search GitHub username..."
								value={input}
								onChange={(e) => {
									setInput(e.target.value);
									fetchSuggestions(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === "Escape") setShowDropdown(false);
								}}
								disabled={isPending}
								autoFocus
							/>

							{showDropdown && suggestions.length > 0 && (
								<div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
									{suggestions.map((s) => (
										<button
											key={s.login}
											type="button"
											className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
											onClick={() => handleSelect(s)}
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
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleTransfer}
						disabled={isPending || !selected}
					>
						{isPending ? "Transferring..." : "Transfer Ownership"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
