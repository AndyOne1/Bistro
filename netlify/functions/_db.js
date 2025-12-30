const { neon } = require("@netlify/neon");

function getSql() {
  // neon() nutzt automatisch NETLIFY_DATABASE_URL* aus den Environment Variables
  return neon();
}

module.exports = { getSql };
