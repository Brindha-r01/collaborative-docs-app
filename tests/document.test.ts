import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "ajaia-docs-test-"));
process.env.DOCUMENTS_FILE = path.join(temporaryDirectory, "documents.json");

const {
  createDocument,
  getDocument,
  listDocuments,
  shareDocument,
  updateDocument,
  validateEmail,
  validateTitle,
} = await import("../lib/documents");

beforeEach(async () => {
  await writeFile(process.env.DOCUMENTS_FILE!, "[]", "utf8");
});

afterAll(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("document validation", () => {
  it("accepts trimmed non-empty titles up to the limit", () => {
    expect(validateTitle("  Project notes ")).toBe(true);
    expect(validateTitle("   ")).toBe(false);
    expect(validateTitle("x".repeat(121))).toBe(false);
  });

  it("validates share addresses", () => {
    expect(validateEmail("alex@example.com")).toBe(true);
    expect(validateEmail("not-an-email")).toBe(false);
  });
});

describe("document persistence and sharing", () => {
  it("persists created documents and restricts the list to owner and invitees", async () => {
    const document = await createDocument("brindha@ajaia.demo", "Planning");

    expect((await listDocuments("brindha@ajaia.demo")).map((item) => item.id)).toEqual([
      document.id,
    ]);
    expect(await listDocuments("alex@ajaia.demo")).toEqual([]);

    await shareDocument(document.id, "brindha@ajaia.demo", "ALEX@ajaia.demo");

    const sharedDocuments = await listDocuments("alex@ajaia.demo");
    expect(sharedDocuments).toHaveLength(1);
    expect(sharedDocuments[0].ownerEmail).toBe("brindha@ajaia.demo");
    await expect(getDocument(document.id, "stranger@example.com")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("allows a shared collaborator to edit persisted document content", async () => {
    const document = await createDocument("brindha@ajaia.demo", "Draft");
    await shareDocument(document.id, "brindha@ajaia.demo", "alex@ajaia.demo");

    const updated = await updateDocument(document.id, "alex@ajaia.demo", {
      title: "Reviewed draft",
      content: "<p>Ready for feedback</p>",
    });

    expect(updated.title).toBe("Reviewed draft");
    expect((await getDocument(document.id, "brindha@ajaia.demo")).content).toBe(
      "<p>Ready for feedback</p>",
    );
  });
});
