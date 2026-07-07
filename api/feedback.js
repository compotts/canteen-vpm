import crypto from "node:crypto";
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

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) {
    return fwd.split(",")[0].trim();
  }
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  return req.socket?.remoteAddress || null;
}

function formatFeedback(row) {
  return {
    id: row.id,
    username: row.username,
    message: row.message,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  try {
    const username = getUsername(req);

    if (req.method === "POST") {
      const { message } = req.body || {};
      const trimmed = typeof message === "string" ? message.trim() : "";

      if (!trimmed) {
        return json(res, 400, { error: "message is required" });
      }
      if (trimmed.length > 4000) {
        return json(res, 400, { error: "message is too long" });
      }

      const id = crypto.randomUUID();
      const ip = getClientIp(req);
      const userAgent =
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"].slice(0, 500)
          : null;

      const rows = await sql`
        insert into feedback (id, username, message, ip, user_agent)
        values (
          ${id},
          ${username || null},
          ${trimmed},
          ${ip},
          ${userAgent}
        )
        returning id, username, message, ip, user_agent, created_at
      `;

      return json(res, 201, formatFeedback(rows[0]));
    }

    // Everything below is admin-only.
    assertAdmin(username);

    if (req.method === "GET") {
      const rows = await sql`
        select id, username, message, ip, user_agent, created_at
        from feedback
        order by created_at desc
        limit 200
      `;
      return json(res, 200, rows.map(formatFeedback));
    }

    if (req.method === "DELETE") {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { error: "id is required" });

      await sql`delete from feedback where id = ${id}`;
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, { error: error?.message || "Internal server error" });
  }
}
