# Ajaia Docs

A focused collaborative-document demo built with Next.js App Router, React, and TypeScript. It supports rich-text editing, local persistence, `.txt`/`.md` import, and a simulated owner/editor sharing flow.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. The document store is created automatically at `data/documents.json` after the first write. To use a different writable JSON file, set `DOCUMENTS_FILE` before starting the app.

To verify the implementation:

```sh
npm test
npm run typecheck
npm run build
```

## Try the sharing flow

The user picker in the top-right switches between two simulated accounts:

- `brindha@ajaia.demo`
- `alex@ajaia.demo`

Create a document as Brindha, choose **Share**, and invite `alex@ajaia.demo`. Switch to Alex to open the document under **Shared with you** and edit it. Switch back to Brindha to see the owner view. This is demo identity only, not authentication.

## Import

Use **Import a file** to create a document from a `.txt` or `.md` file up to 500 KB. Imported text is escaped and inserted as editable paragraphs; markdown is imported as source text rather than rendered markdown. Rich-text documents support headings, bold, italic, underline, lists, and quotes.

## Storage and deployment

Documents are written to a JSON file on the server's local filesystem. This is intentionally simple for local evaluation and requires the app process to have a writable, persistent disk. It is not suitable for serverless/ephemeral deployments, multiple app instances, or production access control. For a public deployment, replace the store with a shared database and demo identity with real authentication. A deployment URL and hosted demo credentials are not included in this repository.
