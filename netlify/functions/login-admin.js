// netlify/functions/login-admin.js
// POST -> authenticate an admin user and return a JWT
// Two possible flows:
//  - If DB configured: verify against users table
//  - Otherwise: allow using ADMIN_USERNAME / ADMIN_PASSWORD env vars (not recommended for prod)

const auth = require('./_auth');
const db = require('./_db');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = event.body ? JSON.parse(event.body) : {};
    const { username, password } = body;
    if (!username || !password) return { statusCode: 400, body: JSON.stringify({ error: 'username and password required' }) };

    if (typeof db.query === 'function') {
      const res = await db.query('SELECT id, username, password_hash, role FROM users WHERE username = $1 AND role = $2 LIMIT 1', [username, 'admin']);
      const user = (res.rows && res.rows[0]) || null;
      if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials' }) };
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials' }) };
      const token = auth.sign({ sub: user.id, username: user.username, role: 'admin' });
      return { statusCode: 200, body: JSON.stringify({ token }) };
    }

    // Env var fallback (for simple setups). Set ADMIN_USERNAME and ADMIN_PASSWORD in Netlify UI.
    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    if (envUser && envPass && username === envUser && password === envPass) {
      const token = auth.sign({ sub: 'env-admin', username, role: 'admin' });
      return { statusCode: 200, body: JSON.stringify({ token }) };
    }

    return { statusCode: 501, body: JSON.stringify({ error: 'Not implemented: configure DB or set ADMIN_USERNAME/ADMIN_PASSWORD' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
