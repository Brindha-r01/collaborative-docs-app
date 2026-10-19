# Submission contents and status

## Included in this repository

- Source code for the Ajaia Docs application.
- [README.md](./README.md) with setup, usage, import, and storage instructions.
- [ARCHITECTURE.md](./ARCHITECTURE.md) with implementation choices and scope limits.
- [AI_WORKFLOW.md](./AI_WORKFLOW.md) with AI-tool usage and verification notes.
- Automated document persistence and sharing tests in `tests/document.test.ts`.

## Not included

- **Live deployment URL:** Not deployed. Local JSON storage needs a persistent writable disk and is not ready for ephemeral/serverless hosting.
- **Walkthrough video URL:** Not recorded.
- **Google Drive folder link:** Not created.
- **Production credentials:** None. The two demo identities are `brindha@ajaia.demo` and `alex@ajaia.demo`; the user picker simulates accounts and is not authentication.

The local product workflow is runnable with `npm install` and `npm run dev`. A public submission still needs deployment on persistent storage and a recorded walkthrough.
