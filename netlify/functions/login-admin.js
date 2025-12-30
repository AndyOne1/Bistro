const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSql } = require("./_db");
const { json } = require("./_auth");

async function ensureAdminPassword(sql) {
  const rows = await sql`SELECT password_hash FROM admin_settings WHERE id = 1`;
  if (rows.length) return rows[0].password_hash;

  const initial = process.env.ADMIN_INITIAL_PASSWORD || "";
  if (initial.length < 8) {
    throw new Error("ADMIN_INITIAL_PASSWORD missing or too short (min 8)");
  }
  const hash = await bcrypt.hash(initial, 10);
  await sql`INSERT INTO admin_settings (id, password_hash) VALUES (1, ${hash})`;
  return hash;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}
  const password = String(body.password || "");

  if (!password) return json(400, { error: "password required" });

  const sql = getSql();
  let storedHash;
  try {
    storedHash = await ensureAdminPassword(sql);
  } catch (e) {
    return json(500, { error: e.message });
  }

  const ok = await bcrypt.compare(password, storedHash);
  if (!ok) return json(401, { error: "Invalid credentials" });

  const token = jwt.sign(
    { role: "admin", name: "admin", groupId: null, groupName: "ADMIN" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  return json(200, { token, role: "admin", name: "admin", groupName: "ADMIN" });
};
