import {
  DocumentError,
  shareDocument,
  validateEmail,
} from "../../../../../lib/documents";
import {
  errorResponse,
  getUserEmail,
  readJson,
} from "../../../../../lib/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !validateEmail(body.email)
    ) {
      throw new DocumentError("Enter a valid email address.", 400);
    }
    return Response.json(
      await shareDocument(id, getUserEmail(request), body.email),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
