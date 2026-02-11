export interface ClaTemplate {
  name: string;
  text: string;
}

export const templates: ClaTemplate[] = [
  {
    name: "Apache Individual CLA (ICLA)",
    text: `# Individual Contributor License Agreement

Thank you for your interest in contributing to this project. This Contributor License Agreement ("Agreement") documents the rights granted by contributors to this project.

## 1. Definitions

"You" (or "Your") shall mean the copyright owner or legal entity authorized by the copyright owner that is making this Agreement. For legal entities, the entity making a Contribution and all other entities that control, are controlled by, or are under common control with that entity are considered to be a single Contributor.

"Contribution" shall mean any original work of authorship, including any modifications or additions to an existing work, that is intentionally submitted by You for inclusion in the project.

## 2. Grant of Copyright License

Subject to the terms and conditions of this Agreement, You hereby grant to the project maintainers and to recipients of software distributed by the project a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute Your Contributions and such derivative works.

## 3. Grant of Patent License

Subject to the terms and conditions of this Agreement, You hereby grant to the project maintainers and to recipients of software distributed by the project a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work.

## 4. Representations

You represent that You are legally entitled to grant the above license. If Your employer(s) has rights to intellectual property that You create that includes Your Contributions, You represent that You have received permission to make Contributions on behalf of that employer.

## 5. Support

You are not expected to provide support for Your Contributions, except to the extent You desire to provide support.

By signing below, You accept and agree to the terms of this Contributor License Agreement for all present and future Contributions.`,
  },
  {
    name: "Developer Certificate of Origin (DCO)",
    text: `# Developer Certificate of Origin

Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.

Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

## Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or

(b) The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or

(c) The contribution was provided directly to me by some other person who certified (a), (b) or (c) and I have not modified it.

(d) I understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information I submit with it, including my sign-off) is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.`,
  },
  {
    name: "Custom (Blank)",
    text: "",
  },
];
