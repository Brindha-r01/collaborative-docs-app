import { DocumentError, validateEmail } from "./documents";

export function getUserEmail(request: Request): string {
  const email = request.headers.get("x-user-email")?.trim().toLowerCase();
  if (!validateEmail(email)) {
    throw new DocumentError("Choose a valid demo user.", 400);
  }
  return email;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof DocumentError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Document API request failed:", error);
  return Response.json(
    { error: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DocumentError("Request body must be valid JSON.", 400);
  }
}
