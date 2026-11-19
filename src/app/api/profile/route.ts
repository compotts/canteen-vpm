import { requireUserProfile } from "@/server/auth";
import { errorResponse, json } from "@/server/http";

export async function GET(request: Request): Promise<Response> {
  try {
    const response = json(await requireUserProfile(request));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
