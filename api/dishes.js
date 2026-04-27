import { sql } from "./_db.js";

function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
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

      const result = rows.map(row => ({
        id: row.id,
        category: row.category,
        name: row.name_lt,
        nameRu: row.name_ru,
        nameEn: row.name_en,
        weight: row.weight,
        priceStudent: parseFloat(row.price_student),
        priceTeacher: parseFloat(row.price_teacher)
      }));

      return json(res, 200, result);
    }

    // For now, only GET is implemented. 
    // Admin functions (POST/PATCH/DELETE) can be added later.
    
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error("API Error:", error);
    return json(res, 500, { error: "Internal server error" });
  }
}
