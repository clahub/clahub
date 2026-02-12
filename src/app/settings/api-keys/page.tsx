import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listApiKeys } from "@/lib/actions/api-key";
import { ApiKeyManager } from "@/components/settings/api-key-manager";

export const metadata = {
  title: "API Keys",
};

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (session.user.role !== "owner") redirect("/");

  const keys = await listApiKeys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">
          Manage API keys for programmatic access to CLAHub
        </p>
      </div>
      <ApiKeyManager keys={JSON.parse(JSON.stringify(keys))} />
    </div>
  );
}
