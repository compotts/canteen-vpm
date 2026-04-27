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

function formatTranslation(row) {
  return {
    id: row.id,
    name: row.name_lt,
    nameRu: row.name_ru,
    nameEn: row.name_en
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT * FROM translations ORDER BY id ASC
      `;

      const result = rows.map(formatTranslation);
      return json(res, 200, result);
    }

    const username = getUsername(req);
    assertAdmin(username);

    if (req.method === "POST") {
      const { name, nameRu, nameEn } = req.body || {};
      
      if (!name) {
        return json(res, 400, { error: "name is required" });
      }

      const rows = await sql`
        INSERT INTO translations (name_lt, name_ru, name_en)
        VALUES (${name}, ${nameRu || null}, ${nameEn || null})
        RETURNING *
      `;

      return json(res, 201, formatTranslation(rows[0]));
    }

    if (req.method === "PATCH") {
      const { id, name, nameRu, nameEn } = req.body || {};
      
      if (!id) {
        return json(res, 400, { error: "id is required" });
      }

      const rows = await sql`
        UPDATE translations
        SET
          name_lt = COALESCE(${name}, name_lt),
          name_ru = COALESCE(${nameRu}, name_ru),
          name_en = COALESCE(${nameEn}, name_en),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) {
        return json(res, 404, { error: "not found" });
      }

      return json(res, 200, formatTranslation(rows[0]));
    }

    if (req.method === "DELETE") {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { error: "id is required" });

      await sql`DELETE FROM translations WHERE id = ${id}`;
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, { error: error?.message || "Internal server error" });
  }
}
