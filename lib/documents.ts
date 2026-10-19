import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  ownerEmail: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
};

export class DocumentError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 500_000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const storagePath =
  process.env.DOCUMENTS_FILE ?? path.join(process.cwd(), "data", "documents.json");

let writeQueue: Promise<void> = Promise.resolve();

export function validateEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    emailPattern.test(value.trim())
  );
}

export function validateTitle(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= MAX_TITLE_LENGTH
  );
}

export function validateContent(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_CONTENT_LENGTH;
}

async function readDocuments(): Promise<DocumentRecord[]> {
  try {
    const contents = await readFile(storagePath, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed)) {
      throw new Error("Document storage must contain a JSON array.");
    }
    return parsed as DocumentRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function updateDocuments<T>(
  update: (documents: DocumentRecord[]) => T,
): Promise<T> {
  let result!: T;
  const operation = writeQueue.then(async () => {
    const documents = await readDocuments();
    result = update(documents);
    await mkdir(path.dirname(storagePath), { recursive: true });
    const temporaryPath = `${storagePath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(documents, null, 2), "utf8");
    await rename(temporaryPath, storagePath);
  });
  writeQueue = operation.catch(() => undefined);
  await operation;
  return result;
}

function findAccessibleDocument(
  documents: DocumentRecord[],
  id: string,
  userEmail: string,
): DocumentRecord {
  const document = documents.find((item) => item.id === id);
  if (!document) {
    throw new DocumentError("Document not found.", 404);
  }
  if (
    document.ownerEmail !== userEmail &&
    !document.sharedWith.includes(userEmail)
  ) {
    throw new DocumentError("You do not have access to this document.", 403);
  }
  return document;
}

export async function listDocuments(
  userEmail: string,
): Promise<DocumentRecord[]> {
  const documents = await readDocuments();
  return documents
    .filter(
      (document) =>
        document.ownerEmail === userEmail ||
        document.sharedWith.includes(userEmail),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createDocument(
  ownerEmail: string,
  title: string,
  content = "<p></p>",
): Promise<DocumentRecord> {
  if (!validateTitle(title)) {
    throw new DocumentError("Title must be between 1 and 120 characters.", 400);
  }
  if (!validateContent(content)) {
    throw new DocumentError("Document content is too large.", 413);
  }
  const now = new Date().toISOString();
  const document: DocumentRecord = {
    id: randomUUID(),
    title: title.trim(),
    content,
    ownerEmail,
    sharedWith: [],
    createdAt: now,
    updatedAt: now,
  };
  await updateDocuments((documents) => documents.push(document));
  return document;
}

export async function getDocument(
  id: string,
  userEmail: string,
): Promise<DocumentRecord> {
  const documents = await readDocuments();
  return findAccessibleDocument(documents, id, userEmail);
}

export async function updateDocument(
  id: string,
  userEmail: string,
  updates: { title: unknown; content: unknown },
): Promise<DocumentRecord> {
  if (!validateTitle(updates.title)) {
    throw new DocumentError("Title must be between 1 and 120 characters.", 400);
  }
  if (!validateContent(updates.content)) {
    throw new DocumentError("Document content is too large.", 413);
  }
  const title = updates.title.trim();
  const content = updates.content;
  return updateDocuments((documents) => {
    const document = findAccessibleDocument(documents, id, userEmail);
    document.title = title;
    document.content = content;
    document.updatedAt = new Date().toISOString();
    return document;
  });
}

export async function shareDocument(
  id: string,
  ownerEmail: string,
  recipientEmail: string,
): Promise<DocumentRecord> {
  if (!validateEmail(recipientEmail)) {
    throw new DocumentError("Enter a valid email address.", 400);
  }
  const normalizedRecipient = recipientEmail.trim().toLowerCase();
  return updateDocuments((documents) => {
    const document = documents.find((item) => item.id === id);
    if (!document) {
      throw new DocumentError("Document not found.", 404);
    }
    if (document.ownerEmail !== ownerEmail) {
      throw new DocumentError("Only the owner can manage sharing.", 403);
    }
    if (normalizedRecipient === ownerEmail) {
      throw new DocumentError("You already own this document.", 400);
    }
    if (!document.sharedWith.includes(normalizedRecipient)) {
      document.sharedWith.push(normalizedRecipient);
      document.updatedAt = new Date().toISOString();
    }
    return document;
  });
}
