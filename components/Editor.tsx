"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { DocumentRecord } from "../lib/documents";

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "H1",
  "H2",
  "H3",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
]);
const REMOVE_WITH_CONTENT = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG"]);

function sanitizeHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const cleanChildren = (parent: ParentNode) => {
    for (const child of Array.from(parent.childNodes)) {
      if (!(child instanceof Element)) continue;
      if (REMOVE_WITH_CONTENT.has(child.tagName)) {
        child.remove();
        continue;
      }
      cleanChildren(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attribute of Array.from(child.attributes)) {
        child.removeAttribute(attribute.name);
      }
    }
  };
  cleanChildren(parsed.body);
  return parsed.body.innerHTML;
}

type EditorProps = {
  document: DocumentRecord;
  userEmail: string;
  saving: boolean;
  onSave: (title: string, content: string) => Promise<void>;
  onShare: (email: string) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
};

export default function Editor({
  document,
  userEmail,
  saving,
  onSave,
  onShare,
  onDirtyChange,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(document.title);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const isOwner = document.ownerEmail === userEmail;

  useEffect(() => {
    setTitle(document.title);
    onDirtyChange(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(document.content);
    }
  }, [document.id, document.content, document.title, onDirtyChange]);

  function runCommand(command: string, value?: string) {
    window.document.execCommand(command, false, value);
  }

  async function save() {
    const content = sanitizeHtml(editorRef.current?.innerHTML ?? "");
    await onSave(title.trim(), content);
  }

  async function share(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shareEmail.trim()) return;
    setSharing(true);
    await onShare(shareEmail.trim());
    setShareEmail("");
    setSharing(false);
  }

  return (
    <div className="editor-view">
      <div className="editor-topline">
        <div className="breadcrumb"><span>Documents</span><span aria-hidden="true">/</span><span>{document.title}</span></div>
        <div className="editor-actions">
          <span className="save-indicator"><span className="status-dot" /> Saved locally</span>
          <button className="secondary-button share-button" onClick={() => setShowShare((visible) => !visible)}>
            <span aria-hidden="true">↗</span> Share
          </button>
          <button className="primary-button save-button" onClick={() => void save()} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {showShare && (
        <section className="share-panel">
          <div className="share-panel-heading">
            <div><strong>Share document</strong><p>Give another demo user access to edit.</p></div>
            <button className="icon-button close-button" onClick={() => setShowShare(false)} aria-label="Close sharing">×</button>
          </div>
          {isOwner ? (
            <form className="share-form" onSubmit={(event) => void share(event)}>
              <input
                aria-label="Email address to share with"
                type="email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="teammate@example.com"
                required
              />
              <button className="primary-button" disabled={sharing}>{sharing ? "Sharing…" : "Invite"}</button>
            </form>
          ) : (
            <p className="share-readonly">You can edit this document, but only the owner can invite people.</p>
          )}
          <div className="access-list">
            <div className="access-row"><span className="avatar small-avatar">{document.ownerEmail.slice(0, 1).toUpperCase()}</span><span><strong>{document.ownerEmail}</strong><small>Owner</small></span></div>
            {document.sharedWith.map((email) => (
              <div className="access-row" key={email}><span className="avatar small-avatar shared-avatar">{email.slice(0, 1).toUpperCase()}</span><span><strong>{email}</strong><small>Can edit</small></span></div>
            ))}
          </div>
        </section>
      )}

      <div className="paper-wrap">
        <article className="paper">
          <input
            className="document-title-input"
            aria-label="Document title"
            value={title}
            maxLength={120}
            disabled={saving}
            onChange={(event) => {
              setTitle(event.target.value);
              onDirtyChange(true);
            }}
            placeholder="Untitled document"
          />
          <div className="paper-rule" />
          <div className="toolbar" aria-label="Text formatting">
            <select
              aria-label="Text style"
              defaultValue="p"
              onChange={(event) => {
                window.document.execCommand("formatBlock", false, event.target.value);
              }}
            >
              <option value="p">Normal text</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
            <span className="toolbar-divider" />
            <button title="Bold" aria-label="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}><strong>B</strong></button>
            <button title="Italic" aria-label="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}><em>I</em></button>
            <button title="Underline" aria-label="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")}><u>U</u></button>
            <span className="toolbar-divider" />
            <button title="Bulleted list" aria-label="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}>•≡</button>
            <button title="Numbered list" aria-label="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}>1≡</button>
            <button title="Quote" aria-label="Quote" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("formatBlock", "blockquote")}>❝</button>
          </div>
          <div
            ref={editorRef}
            className="editable-content"
            contentEditable={!saving}
            suppressContentEditableWarning
            aria-disabled={saving}
            role="textbox"
            aria-label="Document content"
            aria-multiline="true"
            spellCheck
            onInput={() => onDirtyChange(true)}
            data-placeholder="Start writing something wonderful…"
          />
          <div className="paper-footer">Changes are saved when you select Save.</div>
        </article>
      </div>
    </div>
  );
}
