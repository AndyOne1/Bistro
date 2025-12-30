const bcrypt = require("bcryptjs");
const { getSql } = require("./_db");
const { json, requireAdmin } = require("./_auth");

exports.handler = async (event) => {
  const sql = getSql();

  if (event.httpMethod === "GET") {
    const rows = await sql`SELECT id, name FROM groups ORDER BY name ASC`;
    return json(200, { groups: rows });
  }

  if (event.httpMethod === "POST") {
    const admin = requireAdmin(event);
    if (!admin.ok) return admin.error;

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}
    const name = String(body.name || "").trim();
    const password = String(body.password || "");

    if (!name || password.length < 6) {
      return json(400, { error: "Name required and password min length 6" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    try {
      await sql`
        INSERT INTO groups (name, password_hash)
        VALUES (${name}, ${password_hash})
      `;
      return json(200, { ok: true });
    } catch (e) {
      // UNIQUE constraint
      return json(400, { error: "Group already exists" });
    }
  }

  return json(405, { error: "Method not allowed" });
};
