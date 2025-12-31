const { getSql } = require("./_db");
const { json, requireAuth, requireAdmin } = require("./_auth");

exports.handler = async (event) => {
  const sql = getSql();

  if (event.httpMethod === "GET") {
    const auth = requireAuth(event);
    if (!auth.ok) return auth.error;

    const rows = await sql`
      SELECT id, created_at, day_label, submitted_by, group_name, total_revenue, sales_json
      FROM day_reports
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return json(200, { reports: rows });
  }

  if (event.httpMethod === "POST") {
    const auth = requireAuth(event);
    if (!auth.ok) return auth.error;

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}

    const day_label = String(body.day_label || "").trim();
    const total_revenue = Number(body.total_revenue);
    const sales_json = body.sales_json;

    if (!day_label || Number.isNaN(total_revenue) || !sales_json) {
      return json(400, { error: "day_label, total_revenue, sales_json required" });
    }

    const submitted_by = auth.payload.name;
    const group_name = auth.payload.groupName || "Unbekannt";

    const rows = await sql`
  INSERT INTO day_reports (day_label, total_revenue, submitted_by, group_name, sales_json)
  VALUES (
    ${day_label},
    ${total_revenue},
    ${submitted_by},
    ${group_name},
    ${JSON.stringify(sales_json)}::jsonb
  )
  RETURNING id
`;
    return json(200, { ok: true, id: rows[0].id });
  }

  if (event.httpMethod === "DELETE") {
    const admin = requireAdmin(event);
    if (!admin.ok) return admin.error;

    const id = (event.queryStringParameters && event.queryStringParameters.id) ? String(event.queryStringParameters.id) : "";
    if (!id) return json(400, { error: "id required" });

    await sql`DELETE FROM day_reports WHERE id = ${id}`;
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" });
};
