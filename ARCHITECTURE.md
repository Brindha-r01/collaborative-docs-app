# Architecture and tradeoffs

## Product slice

The app is a single-workspace document editor. The sidebar lists documents owned by the selected demo user and documents shared with them. The editor saves a document title and rich-text markup through a server route. The sharing panel adds another demo account as an editor; changing the demo account makes the shared-access behavior visible.

## Implementation

- **UI:** Next.js App Router and React client components. `components/Editor.tsx` provides title editing and browser-native formatting commands for paragraphs, headings, emphasis, lists, and quotes.
- **API:** Route handlers under `app/api/documents` validate user identity, required fields, title length, content size, and document access. Owners can invite; an invited collaborator can read and edit.
- **Persistence:** `lib/documents.ts` serializes writes to a local JSON file and replaces it atomically. `DOCUMENTS_FILE` can select another path. The default location is `data/documents.json`.
- **Import:** The browser accepts `.txt` and `.md` files up to 500 KB, escapes their text, and creates a new editable document. Markdown syntax is intentionally retained as text.
- **Content safety:** The editor strips unsupported tags and attributes both when opening and saving content. The API returns the content as JSON and does not render it as HTML.
- **Verification:** Unit tests cover title/email validation, persistence, sharing visibility, unauthorized reads, and collaborator editing. Type checking is available with `npm run typecheck`.

## Scope cuts and limitations

The user picker is a mock identity selector, not authentication. This is an evaluation/demo mechanism and must not be treated as a security boundary on a public deployment. The JSON file is suitable for one local app process only: there is no cross-process locking, backup, database migration, or multi-instance consistency. Local-disk persistence also does not work reliably on ephemeral/serverless hosting. There is no real-time collaboration, version history, DOCX import, or Markdown rendering.

The next production step would be to use a shared relational database, add authenticated users and owner/editor authorization at the database boundary, then deploy on infrastructure with persistent storage. Real-time presence and conflict resolution are intentionally deferred until the core persistence and access model are production-backed.
