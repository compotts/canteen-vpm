import { put, del } from "@vercel/blob";
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

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function getPhotoUrl(table, id) {
  const rows = table === "dishes"
    ? await sql`SELECT photo_url FROM dishes WHERE id = ${id}`
    : await sql`SELECT photo_url FROM translations WHERE id = ${id}`;
  return rows.length ? { photoUrl: rows[0].photo_url } : null;
}

async function setPhotoUrl(table, id, url) {
  if (table === "dishes") {
    await sql`UPDATE dishes SET photo_url = ${url}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  } else {
    await sql`UPDATE translations SET photo_url = ${url}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  }
}

const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN;

async function deleteBlobSafe(url) {
  if (!url) return;
  try {
    await del(url, { token: blobToken() });
  } catch {
    return;
  }
}

export default async function handler(req, res) {
  try {
    const username = getUsername(req);
    assertAdmin(username);

    const { table, id } = req.query || {};
    if (table !== "dishes" && table !== "translations") {
      return json(res, 400, { error: "table must be dishes or translations" });
    }
    if (!id) {
      return json(res, 400, { error: "id is required" });
    }

    const row = await getPhotoUrl(table, id);
    if (!row) {
      return json(res, 404, { error: "not found" });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      if (!body?.length) {
        return json(res, 400, { error: "empty body" });
      }

      const blob = await put(`${table}/${id}.jpg`, body, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: true,
        token: blobToken()
      });

      await setPhotoUrl(table, id, blob.url);
      await deleteBlobSafe(row.photoUrl);

      return json(res, 200, { id, photoUrl: blob.url });
    }

    if (req.method === "DELETE") {
      await setPhotoUrl(table, id, null);
      await deleteBlobSafe(row.photoUrl);
      return res.status(204).end();
    }

    res.setHeader("Allow", "POST, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, { error: error?.message || "Internal server error" });
  }
}
