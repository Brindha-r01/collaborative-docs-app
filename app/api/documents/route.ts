import {
  createDocument,
  DocumentError,
  listDocuments,
  validateTitle,
} from "../../../lib/documents";
import { errorResponse, getUserEmail, readJson } from "../../../lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userEmail = getUserEmail(request);
    return Response.json(await listDocuments(userEmail));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = getUserEmail(request);
    const body = await readJson(request);
    if (
      typeof body !== "object" ||
      body === null ||
      !("title" in body) ||
      !validateTitle(body.title)
    ) {
      throw new DocumentError("A title between 1 and 120 characters is required.", 400);
    }
    return Response.json(await createDocument(userEmail, body.title), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
