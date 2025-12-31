const bcrypt = require("bcryptjs");
const { getSql } = require("./_db");
const { json, requireAdmin } = require("./_auth");

exports.handler = async (event) => {
  const sql = getSql();

  // Public: list groups for login dropdown
  if (event.httpMethod === "GET") {
    const rows = await sql`SELECT id, name FROM groups ORDER BY name ASC`;
    return json(200, { groups: rows });
  }

  // Everything below is admin-only
  if (["POST", "PUT", "DELETE"].includes(event.httpMethod)) {
    const admin = requireAdmin(event);
    if (!admin.ok) return admin.error;
  }

  // Admin: create group
  if (event.httpMethod === "POST") {
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
    } catch {
      return json(400, { error: "Group already exists" });
    }
  }

  // Admin: update group (currently: change password, optional: rename)
  if (event.httpMethod === "PUT") {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}

    const id = String(body.id || "");
    const newPassword = String(body.newPassword || "");
    const newName = body.newName !== undefined ? String(body.newName || "").trim() : null;

    if (!id) return json(400, { error: "id required" });
    if (newPassword && newPassword.length < 6) {
      return json(400, { error: "newPassword min length 6" });
    }
    if (newName !== null && !newName) {
      return json(400, { error: "newName cannot be empty" });
    }

    const rows = await sql`SELECT id, name FROM groups WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return json(404, { error: "Group not found" });

    // Build update dynamically
    let password_hash = null;
    if (newPassword) password_hash = await bcrypt.hash(newPassword, 10);

    // If both name and password are missing => no-op
    if (newName === null && !password_hash) {
      return json(400, { error: "Nothing to update" });
    }

    try {
      if (newName !== null && password_hash) {
        await sql`UPDATE groups SET name = ${newName}, password_hash = ${password_hash} WHERE id = ${id}`;
      } else if (newName !== null) {
        await sql`UPDATE groups SET name = ${newName} WHERE id = ${id}`;
      } else {
        await sql`UPDATE groups SET password_hash = ${password_hash} WHERE id = ${id}`;
      }
      return json(200, { ok: true });
    } catch {
      return json(400, { error: "Update failed (maybe duplicate group name?)" });
    }
  }

  // Admin: delete group
  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id ? String(event.queryStringParameters.id) : "";
    if (!id) return json(400, { error: "id required" });

    const rows = await sql`SELECT id, name FROM groups WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return json(404, { error: "Group not found" });

    await sql`DELETE FROM groups WHERE id = ${id}`;
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" });
};
