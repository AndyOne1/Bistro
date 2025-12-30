const jwt = require("jsonwebtoken");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function getToken(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

function requireAuth(event) {
  const token = getToken(event);
  if (!token) return { ok: false, error: json(401, { error: "Unauthorized" }) };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { ok: true, payload };
  } catch {
    return { ok: false, error: json(401, { error: "Invalid token" }) };
  }
}

function requireAdmin(event) {
  const auth = requireAuth(event);
  if (!auth.ok) return auth;
  if (auth.payload.role !== "admin") {
    return { ok: false, error: json(403, { error: "Admin required" }) };
  }
  return auth;
}

module.exports = { json, requireAuth, requireAdmin };
