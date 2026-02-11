import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Owner user
  const owner = await prisma.user.upsert({
    where: { githubId: "12345" },
    update: {},
    create: {
      githubId: "12345",
      nickname: "octocat",
      email: "octocat@github.com",
      name: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
      role: "owner",
    },
  });

  // Contributor user
  const contributor = await prisma.user.upsert({
    where: { githubId: "67890" },
    update: {},
    create: {
      githubId: "67890",
      nickname: "contributor-jane",
      email: "jane@example.com",
      name: "Jane Contributor",
      role: "contributor",
    },
  });

  // Agreement for a repo
  const agreement = await prisma.agreement.upsert({
    where: { githubRepoId: "123456789" },
    update: {},
    create: {
      scope: "repo",
      githubRepoId: "123456789",
      ownerName: "octocat",
      repoName: "hello-world",
      ownerId: owner.id,
      installationId: "99999",
    },
  });

  // Agreement version with CLA text
  const version = await prisma.agreementVersion.upsert({
    where: {
      agreementId_version: { agreementId: agreement.id, version: 1 },
    },
    update: {},
    create: {
      agreementId: agreement.id,
      version: 1,
      text: `# Contributor License Agreement

By signing this Agreement, you accept and agree to the following terms
and conditions for your present and future contributions submitted to
this project.

1. **Grant of Copyright License.** You hereby grant a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare derivative works of,
   publicly display, publicly perform, sublicense, and distribute
   your contributions and such derivative works.

2. **Grant of Patent License.** You hereby grant a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   patent license to make, have made, use, offer to sell, sell,
   import, and otherwise transfer your contributions.`,
    },
  });

  // Agreement field
  const field = await prisma.agreementField.upsert({
    where: { id: 1 },
    update: {},
    create: {
      agreementId: agreement.id,
      label: "Full Legal Name",
      dataType: "string",
      required: true,
      description: "Your full legal name as it should appear on the CLA",
      sortOrder: 1,
    },
  });

  // Signature
  const signature = await prisma.signature.upsert({
    where: {
      userId_agreementId: {
        userId: contributor.id,
        agreementId: agreement.id,
      },
    },
    update: {},
    create: {
      userId: contributor.id,
      agreementId: agreement.id,
      versionId: version.id,
      source: "online",
      ipAddress: "127.0.0.1",
    },
  });

  // Field entry
  await prisma.fieldEntry.upsert({
    where: {
      signatureId_fieldId: {
        signatureId: signature.id,
        fieldId: field.id,
      },
    },
    update: {},
    create: {
      signatureId: signature.id,
      fieldId: field.id,
      value: "Jane Doe",
    },
  });

  // Exclusion
  await prisma.exclusion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      agreementId: agreement.id,
      type: "bot_auto",
      githubLogin: "dependabot[bot]",
    },
  });

  // Audit log entry
  await prisma.auditLog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: owner.id,
      action: "agreement.create",
      entityType: "agreement",
      entityId: agreement.id,
      before: null,
      after: JSON.stringify({
        id: agreement.id,
        scope: "repo",
        ownerName: "octocat",
        repoName: "hello-world",
      }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("Seed data created successfully");
  console.log(`  Owner: ${owner.nickname} (id: ${owner.id})`);
  console.log(`  Contributor: ${contributor.nickname} (id: ${contributor.id})`);
  console.log(
    `  Agreement: ${agreement.ownerName}/${agreement.repoName} (id: ${agreement.id})`
  );
  console.log(`  Version: v${version.version}`);
  console.log(`  Signature: ${contributor.nickname} signed v${version.version}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
