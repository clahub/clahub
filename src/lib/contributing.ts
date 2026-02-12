const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function buildContributingCreateUrl(
  ownerName: string,
  repoName: string,
): string {
  const signingUrl = `${APP_URL}/agreements/${ownerName}/${repoName}`;
  const template = [
    `# Contributing to ${ownerName}/${repoName}`,
    "",
    "We welcome contributions! Before submitting a pull request, please sign our Contributor License Agreement (CLA).",
    "",
    "## Contributor License Agreement",
    "",
    `All contributors must sign the CLA before their pull requests can be merged. The process is quick and only needs to be done once:`,
    "",
    `1. Open a pull request`,
    `2. The CLAHub check will prompt you to sign if you haven't already`,
    `3. Click the link to [sign the CLA](${signingUrl})`,
    `4. Once signed, the check will pass automatically`,
    "",
    "## How to Contribute",
    "",
    "1. Fork the repository",
    "2. Create a feature branch (`git checkout -b my-feature`)",
    "3. Commit your changes",
    "4. Push to your fork and open a pull request",
    "",
  ].join("\n");

  return `https://github.com/${ownerName}/${repoName}/new/main?filename=CONTRIBUTING.md&value=${encodeURIComponent(template)}`;
}
