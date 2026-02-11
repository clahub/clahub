import { App } from "@octokit/app";
import { prisma } from "@/lib/prisma";

const globalForGitHub = globalThis as unknown as { githubApp: App };

function createGitHubApp() {
  const app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
    webhooks: { secret: process.env.GITHUB_WEBHOOK_SECRET! },
  });

  registerWebhookHandlers(app);

  return app;
}

/** Lazily initialised GitHub App singleton (survives HMR) */
export function getGitHubApp() {
  if (!globalForGitHub.githubApp) {
    globalForGitHub.githubApp = createGitHubApp();
  }
  return globalForGitHub.githubApp;
}

/** App-level Octokit (JWT-authenticated) */
export function getAppOctokit() {
  return getGitHubApp().octokit;
}

/** Installation-level Octokit for API calls on behalf of an installed app */
export function getInstallationOctokit(installationId: number) {
  return getGitHubApp().getInstallationOctokit(installationId);
}

// ---------------------------------------------------------------------------
// Webhook handlers
// ---------------------------------------------------------------------------

function registerWebhookHandlers(app: App) {
  app.webhooks.on("installation.created", async ({ payload }) => {
    const installationId = String(payload.installation.id);
    const repos = payload.repositories ?? [];

    for (const repo of repos) {
      await prisma.agreement.updateMany({
        where: { githubRepoId: String(repo.id) },
        data: { installationId },
      });
    }
  });

  app.webhooks.on("installation.deleted", async ({ payload }) => {
    const repos = payload.repositories ?? [];

    for (const repo of repos) {
      await prisma.agreement.updateMany({
        where: { githubRepoId: String(repo.id) },
        data: { installationId: null },
      });
    }
  });

  app.webhooks.on(
    "installation_repositories.added",
    async ({ payload }) => {
      const installationId = String(payload.installation.id);

      for (const repo of payload.repositories_added) {
        await prisma.agreement.updateMany({
          where: { githubRepoId: String(repo.id) },
          data: { installationId },
        });
      }
    },
  );

  app.webhooks.on(
    "installation_repositories.removed",
    async ({ payload }) => {
      for (const repo of payload.repositories_removed) {
        await prisma.agreement.updateMany({
          where: { githubRepoId: String(repo.id) },
          data: { installationId: null },
        });
      }
    },
  );
}
