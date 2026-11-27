import { syncMenu } from "@/server/menu/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request): Promise<Response> {
  return syncMenu(request);
}
