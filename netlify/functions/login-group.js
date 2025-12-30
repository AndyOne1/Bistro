// netlify/functions/login-group.js
// POST -> authenticate a group user and return a JWT
// TODO: Replace placeholder verification with DB-backed credential check.

const auth = require('./_auth');
const db = require('./_db');
const bcrypt = require('bcryptjs'); // included in package.json dependencies

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = event.body ? JSON.parse(event.body) : {};
    const { username, password } = body;
    if (!username || !password) return { statusCode: 400, body: JSON.stringify({ error: 'username and password required' }) };

    // If DB available, check credentials there
    if (typeof db.query === 'function') {
      const res = await db.query('SELECT id, username, password_hash, role FROM users WHERE username = $1 AND type = $2 LIMIT 1', [username, 'group']);
      const user = (res.rows && res.rows[0]) || null;
      if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials' }) };
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials' }) };

      const token = auth.sign({ sub: user.id, username: user.username, role: user.role || 'group' });
      return { statusCode: 200, body: JSON.stringify({ token }) };
    }

    // Fallback: not implemented without DB
    return { statusCode: 501, body: JSON.stringify({ error: 'Not implemented: configure DB to enable group login' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
