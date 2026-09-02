import { getCanteenStatus } from "@/server/valgykla-identity";
import { errorResponse, json } from "@/server/http";

export async function GET(): Promise<Response> {
  try {
    return json(await getCanteenStatus());
  } catch (error) {
    return errorResponse(error);
  }
}
