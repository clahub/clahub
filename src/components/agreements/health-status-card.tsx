import { CheckCircle, XCircle, Activity } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthStatusCardProps {
	installationId: string | null;
	scope: string;
	ownerName: string;
	repoName: string | null;
	signatureCount: number;
	createdAt: string;
}

export function HealthStatusCard({
	installationId,
	scope,
	ownerName,
	repoName,
	signatureCount,
	createdAt,
}: HealthStatusCardProps) {
	const isConnected = !!installationId && installationId !== "0";

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Health Status
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 text-sm">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">GitHub App</span>
						{isConnected ? (
							<Badge
								variant="outline"
								className="border-green-300 bg-green-50 text-green-700"
							>
								<CheckCircle className="mr-1 h-3 w-3" />
								Connected
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="border-red-300 bg-red-50 text-red-700"
							>
								<XCircle className="mr-1 h-3 w-3" />
								Not connected
							</Badge>
						)}
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Scope</span>
						<span>
							{scope === "org"
								? `${ownerName} (Org-wide)`
								: `${ownerName}/${repoName}`}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Total signatures</span>
						<span>{signatureCount}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Created</span>
						<span>
							{new Date(createdAt).toLocaleDateString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric",
							})}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
