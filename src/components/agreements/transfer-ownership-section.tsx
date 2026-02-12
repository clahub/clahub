"use client";

import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TransferAgreementDialog } from "./transfer-agreement-dialog";

interface TransferOwnershipSectionProps {
	agreementId: number;
	agreementName: string;
}

export function TransferOwnershipSection({
	agreementId,
	agreementName,
}: TransferOwnershipSectionProps) {
	const [open, setOpen] = useState(false);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Transfer Ownership</CardTitle>
				<CardDescription>
					Transfer this agreement to another CLAHub owner. You will lose
					administrative access.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" onClick={() => setOpen(true)}>
					<ArrowRightLeft className="mr-2 h-4 w-4" />
					Transfer Ownership
				</Button>
			</CardContent>

			<TransferAgreementDialog
				open={open}
				onOpenChange={setOpen}
				agreementId={agreementId}
				agreementName={agreementName}
			/>
		</Card>
	);
}
