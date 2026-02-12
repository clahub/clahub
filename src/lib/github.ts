import { App } from "@octokit/app";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  checkClaForCommitAuthors,
  createCheckRun,
  extractPRAuthors,
  extractPushAuthors,
} from "@/lib/cla-check";

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
    const start = Date.now();
    const action = "webhook.installation.created";
    try {
      const installationId = String(payload.installation.id);
      const repos = payload.repositories ?? [];

      for (const repo of repos) {
        await prisma.agreement.updateMany({
          where: { githubRepoId: String(repo.id) },
          data: { installationId },
        });
      }
      logger.info("Webhook handler completed", {
        action,
        durationMs: Date.now() - start,
        result: "success",
      });
    } catch (err) {
      logger.error(
        "Error handling installation.created event",
        { action, durationMs: Date.now() - start },
        err,
      );
    }
  });

  app.webhooks.on("installation.deleted", async ({ payload }) => {
    const start = Date.now();
    const action = "webhook.installation.deleted";
    try {
      const repos = payload.repositories ?? [];

      for (const repo of repos) {
        await prisma.agreement.updateMany({
          where: { githubRepoId: String(repo.id) },
          data: { installationId: null },
        });
      }
      logger.info("Webhook handler completed", {
        action,
        durationMs: Date.now() - start,
        result: "success",
      });
    } catch (err) {
      logger.error(
        "Error handling installation.deleted event",
        { action, durationMs: Date.now() - start },
        err,
      );
    }
  });

  app.webhooks.on(
    "installation_repositories.added",
    async ({ payload }) => {
      const start = Date.now();
      const action = "webhook.installation_repositories.added";
      try {
        const installationId = String(payload.installation.id);

        for (const repo of payload.repositories_added) {
          await prisma.agreement.updateMany({
            where: { githubRepoId: String(repo.id) },
            data: { installationId },
          });
        }
        logger.info("Webhook handler completed", {
          action,
          durationMs: Date.now() - start,
          result: "success",
        });
      } catch (err) {
        logger.error(
          "Error handling installation_repositories.added event",
          { action, durationMs: Date.now() - start },
          err,
        );
      }
    },
  );

  app.webhooks.on(
    "installation_repositories.removed",
    async ({ payload }) => {
      const start = Date.now();
      const action = "webhook.installation_repositories.removed";
      try {
        for (const repo of payload.repositories_removed) {
          await prisma.agreement.updateMany({
            where: { githubRepoId: String(repo.id) },
            data: { installationId: null },
          });
        }
        logger.info("Webhook handler completed", {
          action,
          durationMs: Date.now() - start,
          result: "success",
        });
      } catch (err) {
        logger.error(
          "Error handling installation_repositories.removed event",
          { action, durationMs: Date.now() - start },
          err,
        );
      }
    },
  );

  // -------------------------------------------------------------------------
  // Pull request events — CLA check
  // -------------------------------------------------------------------------

  app.webhooks.on(
    ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
    async ({ payload }) => {
      const start = Date.now();
      const action = "webhook.pull_request";
      try {
        const repoId = String(payload.repository.id);
        const agreement = await prisma.agreement.findUnique({
          where: { githubRepoId: repoId },
        });

        if (!agreement || agreement.deletedAt || !agreement.installationId) {
          return;
        }

        const octokit = await getInstallationOctokit(
          Number(agreement.installationId),
        );
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const headSha = payload.pull_request.head.sha;

        const authors = await extractPRAuthors(
          octokit,
          owner,
          repo,
          payload.pull_request.number,
        );
        const result = await checkClaForCommitAuthors(agreement.id, authors);
        await createCheckRun(
          octokit,
          owner,
          repo,
          headSha,
          result,
          agreement.ownerName,
          agreement.repoName,
        );
        logger.info("Webhook handler completed", {
          action,
          durationMs: Date.now() - start,
          result: "success",
        });
      } catch (err) {
        logger.error(
          "Error handling pull_request event",
          { action, durationMs: Date.now() - start },
          err,
        );
      }
    },
  );

  // -------------------------------------------------------------------------
  // Push events — CLA check
  // -------------------------------------------------------------------------

  app.webhooks.on("push", async ({ payload }) => {
    const start = Date.now();
    const action = "webhook.push";
    try {
      if (payload.commits.length === 0) return;

      const repoId = String(payload.repository.id);
      const agreement = await prisma.agreement.findUnique({
        where: { githubRepoId: repoId },
      });

      if (!agreement || agreement.deletedAt || !agreement.installationId) {
        return;
      }

      const octokit = await getInstallationOctokit(
        Number(agreement.installationId),
      );
      const owner = payload.repository.owner?.login ?? payload.repository.owner?.name ?? agreement.ownerName;
      const repo = payload.repository.name;

      const authors = extractPushAuthors(payload.commits);
      const result = await checkClaForCommitAuthors(agreement.id, authors);
      await createCheckRun(
        octokit,
        owner,
        repo,
        payload.after,
        result,
        agreement.ownerName,
        agreement.repoName,
      );
      logger.info("Webhook handler completed", {
        action,
        durationMs: Date.now() - start,
        result: "success",
      });
    } catch (err) {
      logger.error(
        "Error handling push event",
        { action, durationMs: Date.now() - start },
        err,
      );
    }
  });

  // -------------------------------------------------------------------------
  // Repository rename / transfer — keep denormalized names in sync
  // -------------------------------------------------------------------------

  app.webhooks.on("repository.renamed", async ({ payload }) => {
    const start = Date.now();
    const action = "webhook.repository.renamed";
    try {
      await prisma.agreement.updateMany({
        where: { githubRepoId: String(payload.repository.id) },
        data: {
          ownerName: payload.repository.owner.login,
          repoName: payload.repository.name,
        },
      });
      logger.info("Webhook handler completed", {
        action,
        durationMs: Date.now() - start,
        result: "success",
      });
    } catch (err) {
      logger.error(
        "Error handling repository.renamed event",
        { action, durationMs: Date.now() - start },
        err,
      );
    }
  });

  app.webhooks.on("repository.transferred", async ({ payload }) => {
    const start = Date.now();
    const action = "webhook.repository.transferred";
    try {
      await prisma.agreement.updateMany({
        where: { githubRepoId: String(payload.repository.id) },
        data: {
          ownerName: payload.repository.owner.login,
          repoName: payload.repository.name,
        },
      });
      logger.info("Webhook handler completed", {
        action,
        durationMs: Date.now() - start,
        result: "success",
      });
    } catch (err) {
      logger.error(
        "Error handling repository.transferred event",
        { action, durationMs: Date.now() - start },
        err,
      );
    }
  });
}
