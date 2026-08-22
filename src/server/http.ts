export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }
  console.error(error);
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return json({ error: message }, 500);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function parse<T>(
  schema: { safeParse: (data: unknown) => SafeParseResult<T> },
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues[0]?.message ?? "Invalid request"
    );
  }
  return result.data;
}

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: { message: string }[] } };
