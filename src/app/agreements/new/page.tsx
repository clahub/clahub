import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchInstallationRepos } from "@/lib/actions/agreement";
import { AgreementForm } from "@/components/agreements/agreement-form";

export const metadata = {
  title: "New Agreement",
};

export default async function NewAgreementPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const installations = await fetchInstallationRepos();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Agreement</h1>
        <p className="text-muted-foreground">
          Create a Contributor License Agreement for a repository
        </p>
      </div>

      <AgreementForm mode="create" installations={installations} />
    </div>
  );
}
