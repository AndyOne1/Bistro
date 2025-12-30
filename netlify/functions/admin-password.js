// netlify/functions/admin-password.js
// POST -> set or update admin password
// Protect this endpoint with admin auth in front (or require a secret).
//
// If you have a DB, implement persistence. This endpoint currently expects a DB with an "admins" or "users" table.

const db = require('./_db');
const auth = require('./_auth');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // require admin JWT to perform changes (prevent anonymous calls)
    const user = auth.fromEvent(event);
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'admin required' }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { targetUsername, newPassword } = body;
    if (!targetUsername || !newPassword) return { statusCode: 400, body: JSON.stringify({ error: 'targetUsername and newPassword required' }) };

    if (typeof db.query === 'function') {
      const hash = await bcrypt.hash(newPassword, 10);
      const res = await db.query('UPDATE users SET password_hash = $1 WHERE username = $2 AND role = $3 RETURNING id, username', [hash, targetUsername, 'admin']);
      if (!res.rows || res.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'admin user not found' }) };
      }
      return { statusCode: 200, body: JSON.stringify({ message: 'password updated', user: res.rows[0] }) };
    }

    return { statusCode: 501, body: JSON.stringify({ error: 'Not implemented: configure DB to persist admin passwords' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
