// netlify/functions/groups.js
// GET -> list groups
// POST -> create a group (requires admin)
// TODO: Wire into DB by implementing _db.query

const db = require('./_db');
const auth = require('./_auth');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      // Example: if DB configured, replace with a real query
      if (typeof db.query === 'function') {
        const res = await db.query('SELECT * FROM groups ORDER BY id LIMIT 100', []);
        return { statusCode: 200, body: JSON.stringify({ groups: res.rows || res }) };
      }

      return { statusCode: 200, body: JSON.stringify({ groups: [], message: 'DB not configured' }) };
    }

    if (event.httpMethod === 'POST') {
      const user = auth.fromEvent(event);
      if (!user || user.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'admin required' }) };
      }

      const body = event.body ? JSON.parse(event.body) : {};
      const { name, metadata } = body;
      if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'name required' }) };

      if (typeof db.query === 'function') {
        const res = await db.query('INSERT INTO groups(name, metadata) VALUES($1, $2) RETURNING *', [name, metadata || {}]);
        return { statusCode: 201, body: JSON.stringify({ group: res.rows ? res.rows[0] : res }) };
      }

      return { statusCode: 201, body: JSON.stringify({ message: 'not persisted: DB not configured', group: { name, metadata } }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
