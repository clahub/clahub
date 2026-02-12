"use client";

import { useTransition, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNotificationPreference } from "@/lib/actions/agreement";

export function NotificationToggle({
  agreementId,
  initialEnabled,
}: {
  agreementId: number;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean | "indeterminate") {
    if (checked === "indeterminate") return;

    const prev = enabled;
    setEnabled(checked);

    startTransition(async () => {
      const result = await updateNotificationPreference({
        agreementId,
        notifyOnSign: checked,
      });

      if (result.success) {
        toast.success(
          checked
            ? "Email notifications enabled"
            : "Email notifications disabled",
        );
      } else {
        setEnabled(prev);
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Checkbox
            id="notify-on-sign"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
          <Label htmlFor="notify-on-sign" className="text-sm">
            Receive an email when someone signs this agreement
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
