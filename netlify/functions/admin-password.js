const bcrypt = require("bcryptjs");
const { getSql } = require("./_db");
const { json, requireAdmin } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const admin = requireAdmin(event);
  if (!admin.ok) return admin.error;

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  const current = String(body.currentPassword || "");
  const next = String(body.newPassword || "");

  if (next.length < 8) return json(400, { error: "New password min length 8" });

  const sql = getSql();
  const rows = await sql`SELECT password_hash FROM admin_settings WHERE id = 1 LIMIT 1`;
  if (!rows.length) return json(500, { error: "Admin password not initialized" });

  const ok = await bcrypt.compare(current, rows[0].password_hash);
  if (!ok) return json(401, { error: "Current password incorrect" });

  const hash = await bcrypt.hash(next, 10);
  await sql`UPDATE admin_settings SET password_hash = ${hash}, updated_at = now() WHERE id = 1`;

  return json(200, { ok: true });
};
