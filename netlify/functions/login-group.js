const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSql } = require("./_db");
const { json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  const groupId = String(body.groupId || "");
  const password = String(body.password || "");
  const name = String(body.name || "").trim();

  if (!groupId || !password || !name) {
    return json(400, { error: "groupId, password, name required" });
  }

  const sql = getSql();
  const rows = await sql`SELECT id, name, password_hash FROM groups WHERE id = ${groupId} LIMIT 1`;
  if (!rows.length) return json(401, { error: "Invalid credentials" });

  const group = rows[0];
  const ok = await bcrypt.compare(password, group.password_hash);
  if (!ok) return json(401, { error: "Invalid credentials" });

  const token = jwt.sign(
    { role: "user", name, groupId: group.id, groupName: group.name },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  return json(200, { token, role: "user", name, groupName: group.name });
};
