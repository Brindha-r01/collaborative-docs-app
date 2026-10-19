import {
  DocumentError,
  getDocument,
  updateDocument,
} from "../../../../lib/documents";
import { errorResponse, getUserEmail, readJson } from "../../../../lib/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return Response.json(await getDocument(id, getUserEmail(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    if (
      typeof body !== "object" ||
      body === null ||
      !("title" in body) ||
      !("content" in body)
    ) {
      throw new DocumentError("A title and document content are required.", 400);
    }
    return Response.json(
      await updateDocument(id, getUserEmail(request), {
        title: body.title,
        content: body.content,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
