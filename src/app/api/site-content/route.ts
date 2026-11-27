import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { siteContent } from "@/server/db/schema";
import {
  formatSiteContent,
  getSiteContent,
} from "@/server/queries/site-content";
import { auditMutation } from "@/server/activity";
import { errorResponse, parse, readJson } from "@/server/http";
import { siteContentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return Response.json(await getSiteContent(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const { username } = await requireAdmin(request, "updates");
    const input = parse(siteContentSchema, await readJson(request));
    const values = {
      key: input.key,
      textLt: input.text.lt,
      textRu: input.text.ru,
      textEn: input.text.en,
      updatedBy: username,
      updatedAt: new Date(),
    };
    const [row] = await auditMutation(
      db
        .insert(siteContent)
        .values(values)
        .onConflictDoUpdate({ target: siteContent.key, set: values })
        .returning(),
      {
        username,
        category: "admin",
        action: "content_update",
        target: input.key,
        details: input,
      },
      request,
    );
    return Response.json(formatSiteContent(row), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
