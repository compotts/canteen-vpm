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

function formatDish(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name_lt,
    nameRu: row.name_ru,
    nameEn: row.name_en,
    weight: row.weight,
    priceStudent: parseFloat(row.price_student),
    priceTeacher: parseFloat(row.price_teacher)
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { category } = req.query;
      
      let rows;
      if (category) {
        rows = await sql`
          SELECT * FROM dishes WHERE category = ${category} ORDER BY id ASC
        `;
      } else {
        rows = await sql`
          SELECT * FROM dishes ORDER BY category, id ASC
        `;
      }

      const result = rows.map(formatDish);
      return json(res, 200, result);
    }

    const username = getUsername(req);
    assertAdmin(username);

    if (req.method === "POST") {
      const { id, category, name, nameRu, nameEn, weight, priceStudent, priceTeacher } = req.body || {};
      
      if (!id || !category || !name) {
        return json(res, 400, { error: "id, category, and name are required" });
      }

      const rows = await sql`
        INSERT INTO dishes (id, category, name_lt, name_ru, name_en, weight, price_student, price_teacher)
        VALUES (${id}, ${category}, ${name}, ${nameRu || null}, ${nameEn || null}, ${weight || null}, ${priceStudent || 0}, ${priceTeacher || 0})
        ON CONFLICT (id) DO UPDATE SET
          category = EXCLUDED.category,
          name_lt = EXCLUDED.name_lt,
          name_ru = EXCLUDED.name_ru,
          name_en = EXCLUDED.name_en,
          weight = EXCLUDED.weight,
          price_student = EXCLUDED.price_student,
          price_teacher = EXCLUDED.price_teacher,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      return json(res, 201, formatDish(rows[0]));
    }

    if (req.method === "PATCH") {
      const { id, category, name, nameRu, nameEn, weight, priceStudent, priceTeacher } = req.body || {};
      
      if (!id) {
        return json(res, 400, { error: "id is required" });
      }

      const rows = await sql`
        UPDATE dishes
        SET
          category = COALESCE(${category}, category),
          name_lt = COALESCE(${name}, name_lt),
          name_ru = COALESCE(${nameRu}, name_ru),
          name_en = COALESCE(${nameEn}, name_en),
          weight = COALESCE(${weight}, weight),
          price_student = COALESCE(${priceStudent}, price_student),
          price_teacher = COALESCE(${priceTeacher}, price_teacher),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) {
        return json(res, 404, { error: "not found" });
      }

      return json(res, 200, formatDish(rows[0]));
    }

    if (req.method === "DELETE") {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { error: "id is required" });

      await sql`DELETE FROM dishes WHERE id = ${id}`;
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, { error: error?.message || "Internal server error" });
  }
}
