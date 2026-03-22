import crypto from "node:crypto";
import { sql } from "./_db.js";

function getUsername(req) {
  const value =
    req.headers["x-username"] ||
    req.query?.username ||
    req.body?.username;

  return typeof value === "string" ? value.trim() : "";
}

function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    const username = getUsername(req);

    if (!username) {
      return json(res, 400, { error: "username is required" });
    }

    if (req.method === "GET") {
      const rows = await sql`
        select
          id,
          username,
          menu_date as "menuDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          items,
          order_total::float8 as "orderTotal"
        from order_history
        where username = ${username}
        order by created_at desc
      `;

      return json(res, 200, rows);
    }

    if (req.method === "POST") {
      const { menuDate, items, orderTotal } = req.body || {};

      if (!menuDate) {
        return json(res, 400, { error: "menuDate is required" });
      }

      const normalizedItems = Array.isArray(items) ? items : [];
      const normalizedTotal = Number(orderTotal || 0);
      const id = crypto.randomUUID();

      const rows = await sql`
        insert into order_history (
          id, username, menu_date, items, order_total
        )
        values (
          ${id},
          ${username},
          ${menuDate},
          ${JSON.stringify(normalizedItems)}::jsonb,
          ${normalizedTotal}
        )
        on conflict (username, menu_date)
        do update set
          items = excluded.items,
          order_total = excluded.order_total,
          updated_at = now()
        returning
          id,
          username,
          menu_date as "menuDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          items,
          order_total::float8 as "orderTotal"
      `;

      return json(res, 200, rows[0]);
    }

    if (req.method === "PATCH") {
      const { menuDate, itemId, nextQuantity } = req.body || {};

      if (!menuDate || !itemId) {
        return json(res, 400, { error: "menuDate and itemId are required" });
      }

      const rows = await sql`
        select items
        from order_history
        where username = ${username} and menu_date = ${menuDate}
        limit 1
      `;

      const order = rows[0];
      if (!order) {
        return json(res, 404, { error: "Order not found" });
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const q = Math.max(0, Math.round(Number(nextQuantity || 0) * 2) / 2);

      const nextItems = items
        .map((it) => {
          if (!it || String(it.id) !== String(itemId)) return it;
          if (q <= 0) return null;

          const pricePerUnit = Number(it.pricePerUnit || 0);
          return {
            ...it,
            quantity: q,
            totalPrice: Number((pricePerUnit * q).toFixed(2)),
          };
        })
        .filter(Boolean);

      if (nextItems.length === 0) {
        await sql`
          delete from order_history
          where username = ${username} and menu_date = ${menuDate}
        `;
        return res.status(204).end();
      }

      const nextTotal = nextItems.reduce(
        (sum, it) => sum + Number(it.totalPrice || 0),
        0
      );

      const updated = await sql`
        update order_history
        set
          items = ${JSON.stringify(nextItems)}::jsonb,
          order_total = ${Number(nextTotal.toFixed(2))},
          updated_at = now()
        where username = ${username} and menu_date = ${menuDate}
        returning
          id,
          username,
          menu_date as "menuDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          items,
          order_total::float8 as "orderTotal"
      `;

      return json(res, 200, updated[0]);
    }

    if (req.method === "DELETE") {
      const { menuDate } = req.query || {};

      if (menuDate) {
        await sql`
          delete from order_history
          where username = ${username} and menu_date = ${menuDate}
        `;
        return res.status(204).end();
      }

      await sql`
        delete from order_history
        where username = ${username}
      `;
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, {
      error: error?.message || "Internal server error",
    });
  }
}