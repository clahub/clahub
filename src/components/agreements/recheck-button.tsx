"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { recheckAgreementPRs } from "@/lib/actions/recheck";

interface RecheckButtonProps {
	agreementId: number;
}

export function RecheckButton({ agreementId }: RecheckButtonProps) {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		checked: number;
		updated: number;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleRecheck() {
		setResult(null);
		setError(null);
		setLoading(true);
		try {
			const res = await recheckAgreementPRs({ agreementId });
			if (res.success) {
				setResult(res.result);
			} else {
				setError(res.error);
			}
		} catch {
			setError("An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<RefreshCw className="h-5 w-5" />
					PR Re-check
				</CardTitle>
				<CardDescription>
					Manually re-evaluate all open pull requests for this repository.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button
					variant="outline"
					onClick={handleRecheck}
					disabled={loading}
				>
					{loading ? (
						<>
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							Checking PRs…
						</>
					) : (
						<>
							<RefreshCw className="mr-2 h-4 w-4" />
							Re-check all open PRs
						</>
					)}
				</Button>

				{result && (
					<div className="flex items-center gap-2 text-sm text-green-700">
						<CheckCircle className="h-4 w-4" />
						Checked {result.checked} PR{result.checked !== 1 ? "s" : ""},
						updated {result.updated}.
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 text-sm text-red-600">
						<XCircle className="h-4 w-4" />
						{error}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
