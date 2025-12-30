// netlify/functions/_db.js
// Minimal DB adapter placeholder. Replace with your DB client (pg, knex, prisma, etc.)
//
// Usage:
//   const { query, getClient } = require('./_db');
//
// If you wire up a real DB, implement getClient() and query(sql, params).
const NOT_CONFIGURED = () => {
  throw new Error(
    'DB client not configured. Replace netlify/functions/_db.js with a real DB adapter or set up query/getClient functions.'
  );
};

module.exports = {
  // Return a client/connection (optional)
  getClient: NOT_CONFIGURED,

  // Run a query: query(sql, params)
  query: NOT_CONFIGURED,
};
