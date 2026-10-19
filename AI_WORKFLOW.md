# AI workflow note

- **Tool used:** GitHub Copilot SDK in VS Code.
- **Where it helped:** Translating the assignment into a small end-to-end scope, implementing the document API and editor surfaces, and drafting setup/architecture notes.
- **What was changed or rejected:** The initial repository contained only placeholder screens and a placeholder Prisma module. I replaced the placeholder data layer with a small file-backed store instead of introducing a database dependency that would not be configured or deployed. The app explicitly labels its selectable identities as demo users rather than presenting them as real authentication.
- **How correctness was checked:** The repository includes automated tests for validation, persistence, sharing visibility, access denial, and edits by a shared collaborator, plus a TypeScript check. Run `npm test`, `npm run typecheck`, and `npm run build` locally. No public deployment or walkthrough video was created as part of this code change.
