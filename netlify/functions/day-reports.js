// netlify/functions/day-reports.js
// GET -> fetch reports (optionally by date)
// POST -> create a report (requires authenticated user)
// TODO: Wire into DB and add validation.

const db = require('./_db');
const auth = require('./_auth');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const date = params.date; // optional ISO date filter

      if (typeof db.query === 'function') {
        if (date) {
          const res = await db.query('SELECT * FROM reports WHERE date = $1 ORDER BY created_at DESC', [date]);
          return { statusCode: 200, body: JSON.stringify({ reports: res.rows }) };
        } else {
          const res = await db.query('SELECT * FROM reports ORDER BY date DESC, created_at DESC LIMIT 100', []);
          return { statusCode: 200, body: JSON.stringify({ reports: res.rows }) };
        }
      }

      return { statusCode: 200, body: JSON.stringify({ reports: [], message: 'DB not configured' }) };
    }

    if (event.httpMethod === 'POST') {
      const user = auth.fromEvent(event);
      if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'authentication required' }) };

      const body = event.body ? JSON.parse(event.body) : {};
      const { date, items } = body;
      if (!date || !Array.isArray(items)) return { statusCode: 400, body: JSON.stringify({ error: 'date and items[] required' }) };

      if (typeof db.query === 'function') {
        const res = await db.query('INSERT INTO reports(author_id, date, data) VALUES($1, $2, $3) RETURNING *', [user.sub, date, { items }]);
        return { statusCode: 201, body: JSON.stringify({ report: res.rows[0] }) };
      }

      return { statusCode: 201, body: JSON.stringify({ message: 'not persisted: DB not configured', draft: { author: user.username || user.sub, date, items } }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
