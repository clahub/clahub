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

  // If a dev server is already running (local dev), skip DB setup —
  // the developer's database already has seed data.
  if (await isPortInUse(3000)) {
    console.log("[global-setup] Reusing existing dev server on :3000, skipping DB reset.");
    return;
  }

  // CI path: push schema to test DB and seed it
  const testEnv = {
    ...process.env,
    DATABASE_URL: "file:./test.db",
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
