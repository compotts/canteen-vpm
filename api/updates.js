import { sql } from "./_db.js";
import { getUsername, isAdminUsername } from "./_auth.js";

function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function assertAdmin(username) {
  if (!isAdminUsername(username)) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
}

function normalizeTextPayload(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  return {
    lt: typeof safe.lt === "string" ? safe.lt : "",
    ru: typeof safe.ru === "string" ? safe.ru : "",
    en: typeof safe.en === "string" ? safe.en : "",
  };
}

export default async function handler(req, res) {
  try {
    const username = getUsername(req);

    if (req.method === "GET") {
      const rows = await sql`
        select
          id,
          username,
          version,
          date_label as "dateLabel",
          emoji,
          text_lt,
          text_ru,
          text_en,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from app_updates
        order by created_at desc
        limit 50
      `;

      const result = rows.map((row) => ({
        id: row.id,
        username: row.username,
        version: row.version,
        dateLabel: row.dateLabel,
        emoji: row.emoji,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        text: {
          lt: row.text_lt || "",
          ru: row.text_ru || "",
          en: row.text_en || "",
        },
      }));

      return json(res, 200, result);
    }

    assertAdmin(username);

    if (req.method === "POST") {
      const { version, dateLabel, emoji, text } = req.body || {};
      const normalizedText = normalizeTextPayload(text);
      const rows = await sql`
        insert into app_updates (
          username,
          version,
          date_label,
          emoji,
          text_lt,
          text_ru,
          text_en
        )
        values (
          ${username},
          ${version || null},
          ${dateLabel || null},
          ${emoji || null},
          ${normalizedText.lt || null},
          ${normalizedText.ru || null},
          ${normalizedText.en || null}
        )
        returning
          id,
          username,
          version,
          date_label as "dateLabel",
          emoji,
          text_lt,
          text_ru,
          text_en,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const row = rows[0];
      return json(res, 201, {
        id: row.id,
        username: row.username,
        version: row.version,
        dateLabel: row.dateLabel,
        emoji: row.emoji,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        text: {
          lt: row.text_lt || "",
          ru: row.text_ru || "",
          en: row.text_en || "",
        },
      });
    }

    if (req.method === "PATCH") {
      const { id, version, dateLabel, emoji, text } = req.body || {};
      if (!id) {
        return json(res, 400, { error: "id is required" });
      }
      const normalizedText = text ? normalizeTextPayload(text) : null;
      const rows = await sql`
        update app_updates
        set
          version = coalesce(${version}, version),
          date_label = coalesce(${dateLabel}, date_label),
          emoji = coalesce(${emoji}, emoji),
          text_lt = coalesce(${normalizedText?.lt}, text_lt),
          text_ru = coalesce(${normalizedText?.ru}, text_ru),
          text_en = coalesce(${normalizedText?.en}, text_en),
          updated_at = now()
        where id = ${id}
        returning
          id,
          username,
          version,
          date_label as "dateLabel",
          emoji,
          text_lt,
          text_ru,
          text_en,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      if (!rows.length) {
        return json(res, 404, { error: "not found" });
      }

      const row = rows[0];
      return json(res, 200, {
        id: row.id,
        username: row.username,
        version: row.version,
        dateLabel: row.dateLabel,
        emoji: row.emoji,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        text: {
          lt: row.text_lt || "",
          ru: row.text_ru || "",
          en: row.text_en || "",
        },
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { error: "id is required" });

      await sql`
        delete from app_updates
        where id = ${id}
      `;
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, {
      error: error?.message || "Internal server error",
    });
  }
}

