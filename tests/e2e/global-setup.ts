import { execSync } from "child_process";
import path from "path";
import net from "net";

/** Check if a port is already in use (i.e. a dev server is running). */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

export default async function globalSetup() {
  const root = path.resolve(__dirname, "../..");

  // In CI, Playwright starts the webServer before globalSetup runs, so
  // port 3000 is always in use. Use process.env.CI to distinguish CI from
  // local dev where the developer's own server (with a seeded DB) is running.
  if (!process.env.CI && (await isPortInUse(3000))) {
    console.log("[global-setup] Reusing existing dev server on :3000, skipping DB reset.");
    return;
  }

  console.log("[global-setup] Setting up test database...");

  // Use DATABASE_URL from the environment (CI sets an absolute path) or
  // fall back to the relative path for local runs.
  const testEnv = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || "file:./test.db",
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "Yes, proceed",
  };

  execSync("npx prisma db push --force-reset --accept-data-loss", {
    cwd: root,
    stdio: "inherit",
    env: testEnv,
  });

  execSync("npx prisma db seed", {
    cwd: root,
    stdio: "inherit",
    env: testEnv,
  });
}
