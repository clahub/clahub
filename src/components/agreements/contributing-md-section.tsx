"use client";

import { useEffect, useState, useTransition } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	checkContributingMd,
	type ContributingMdResult,
} from "@/lib/actions/contributing";
import { buildContributingCreateUrl } from "@/lib/contributing";

interface ContributingMdSectionProps {
	ownerName: string;
	repoName: string;
	installationId: string | null;
}

export function ContributingMdSection({
	ownerName,
	repoName,
	installationId,
}: ContributingMdSectionProps) {
	const [result, setResult] = useState<ContributingMdResult | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		startTransition(async () => {
			const r = await checkContributingMd({
				ownerName,
				repoName,
				installationId,
			});
			setResult(r);
		});
	}, [ownerName, repoName, installationId]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileText className="h-5 w-5" />
					CONTRIBUTING.md
				</CardTitle>
				<CardDescription>
					A CONTRIBUTING.md file helps contributors understand how to sign the
					CLA before opening a pull request.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isPending || !result ? (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Checking repository…
					</div>
				) : result.exists ? (
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
							Your repository has a CONTRIBUTING.md file.
						</p>
						<Button variant="outline" size="sm" asChild>
							<a
								href={result.htmlUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								View on GitHub
							</a>
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
							No CONTRIBUTING.md found. Create one with a CLA signing link so
							contributors know how to sign before opening a pull request.
						</p>
						<Button variant="outline" size="sm" asChild>
							<a
								href={buildContributingCreateUrl(ownerName, repoName)}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Create CONTRIBUTING.md on GitHub
							</a>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
