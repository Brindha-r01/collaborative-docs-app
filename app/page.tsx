"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Editor from "../components/Editor";
import type { DocumentRecord } from "../lib/documents";

const DEMO_USERS = [
  { email: "brindha@ajaia.demo", name: "Brindha" },
  { email: "alex@ajaia.demo", name: "Alex (teammate)" },
];

async function request<T>(
  url: string,
  userEmail: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-email": userEmail,
      ...init?.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? "Something went wrong.");
  }
  return result as T;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function importedTextToHtml(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>") || "<br>"}</p>`)
    .join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function Home() {
  const [userEmail, setUserEmail] = useState(DEMO_USERS[0].email);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDocuments([]);
    setSelectedId(null);
    request<DocumentRecord[]>("/api/documents", userEmail)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load documents.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userEmail]);

  const selectedDocument = documents.find((item) => item.id === selectedId) ?? null;
  const filteredDocuments = useMemo(
    () => documents.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    [documents, search],
  );
  const userName =
    DEMO_USERS.find((user) => user.email === userEmail)?.name ?? userEmail;

  function confirmDiscardChanges() {
    return !isDirty || window.confirm("You have unsaved changes. Leave without saving?");
  }

  async function createDocument(title = "Untitled document", content?: string) {
    if (!confirmDiscardChanges()) return;
    setError("");
    setNotice("");
    try {
      const document = await request<DocumentRecord>("/api/documents", userEmail, {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      setDocuments((items) => [document, ...items]);
      setSelectedId(document.id);
      setIsDirty(false);
      setNotice("Document created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the document.");
    }
  }

  async function saveDocument(title: string, content: string) {
    if (!selectedDocument) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await request<DocumentRecord>(
        `/api/documents/${selectedDocument.id}`,
        userEmail,
        { method: "PUT", body: JSON.stringify({ title, content }) },
      );
      setDocuments((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice("All changes saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function shareDocument(email: string) {
    if (!selectedDocument) return;
    setError("");
    setNotice("");
    try {
      const updated = await request<DocumentRecord>(
        `/api/documents/${selectedDocument.id}/share`,
        userEmail,
        { method: "POST", body: JSON.stringify({ email }) },
      );
      setDocuments((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`Shared with ${email.trim()}. Switch demo users to test access.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not share the document.");
    }
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md"].includes(extension ?? "")) {
      setError("Upload a .txt or .md file.");
      return;
    }
    if (file.size > 500_000) {
      setError("Files must be 500 KB or smaller.");
      return;
    }
    try {
      const content = importedTextToHtml(await file.text());
      await createDocument(file.name.replace(/\.(txt|md)$/i, ""), content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read that file.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Ajaia Docs home">
          <span className="brand-mark">a</span>
          <span>Ajaia <strong>Docs</strong></span>
        </a>
        <div className="topbar-right">
          <span className="demo-label">DEMO USER</span>
          <select
            aria-label="Switch demo user"
            className="user-select"
            value={userEmail}
            onChange={(event) => {
              if (event.target.value === userEmail) return;
              if (!confirmDiscardChanges()) return;
              setError("");
              setNotice("");
              setIsDirty(false);
              setUserEmail(event.target.value);
            }}
          >
            {DEMO_USERS.map((user) => (
              <option key={user.email} value={user.email}>
                {user.name}
              </option>
            ))}
          </select>
          <span className="avatar" title={userEmail}>{userName.slice(0, 1).toUpperCase()}</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h1>Documents</h1>
            </div>
            <button className="icon-button create-icon" onClick={() => void createDocument()} aria-label="Create document">
              +
            </button>
          </div>
          <button className="primary-button new-document" onClick={() => void createDocument()}>
            <span aria-hidden="true">＋</span> New document
          </button>
          <label className="upload-button">
            <span aria-hidden="true">↑</span> Import a file
            <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={uploadFile} />
          </label>
          <p className="hint">Import a .txt or .md file · up to 500 KB</p>

          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a document"
              aria-label="Find a document"
            />
            <kbd>/</kbd>
          </label>

          <div className="list-heading"><span>RECENT</span><span>{documents.length}</span></div>
          <nav className="document-list" aria-label="Your documents">
            {loading ? (
              <p className="list-message">Loading your workspace…</p>
            ) : filteredDocuments.length === 0 ? (
              <p className="list-message">
                {documents.length ? "No documents match your search." : "Your documents will appear here."}
              </p>
            ) : (
              filteredDocuments.map((document) => {
                const isShared = document.ownerEmail !== userEmail;
                return (
                  <button
                    className={`document-row${selectedId === document.id ? " selected" : ""}`}
                    key={document.id}
                    onClick={() => {
                      if (document.id === selectedId || !confirmDiscardChanges()) return;
                      setError("");
                      setNotice("");
                      setSelectedId(document.id);
                    }}
                  >
                    <span className="file-icon" aria-hidden="true">▤</span>
                    <span className="document-row-copy">
                      <span className="document-row-title">{document.title}</span>
                      <span className="document-row-meta">
                        {isShared ? "Shared with you" : "You own this"} · {formatDate(document.updatedAt)}
                      </span>
                    </span>
                    {isShared && <span className="shared-dot" aria-label="Shared" />}
                  </button>
                );
              })
            )}
          </nav>
          <div className="sidebar-footer">
            <span className="status-dot" /> Private demo workspace
          </div>
        </aside>

        <section className="main-panel">
          <div className="message-area" aria-live="polite">
            {error && <div className="toast error-toast">{error}<button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
            {notice && !error && <div className="toast success-toast">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
          </div>
          {selectedDocument ? (
            <Editor
              key={selectedDocument.id}
              document={selectedDocument}
              userEmail={userEmail}
              saving={saving}
              onSave={saveDocument}
              onShare={shareDocument}
              onDirtyChange={setIsDirty}
            />
          ) : (
            <div className="welcome">
              <div className="welcome-art" aria-hidden="true">
                <div className="art-sheet"><span /><span /><span /><span /><b /></div>
                <div className="art-spark">✳</div>
              </div>
              <p className="eyebrow">A CLEAR SPACE TO THINK</p>
              <h2>{loading ? "Opening your workspace…" : "Make room for your next big idea."}</h2>
              <p className="welcome-copy">
                Create a document, or switch demo users to see how sharing works.
              </p>
              <button className="primary-button welcome-button" onClick={() => void createDocument()}>
                <span aria-hidden="true">＋</span> Create a document
              </button>
              <span className="welcome-shortcut">Your changes are saved to this workspace.</span>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
