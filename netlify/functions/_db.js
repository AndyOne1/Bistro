const { neon } = require("@netlify/neon");

function getSql() {
  const url =
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.NETLIFY_DATABASE_URL;

  if (!url) {
    throw new Error("Missing NETLIFY_DATABASE_URL (Netlify DB not configured)");
  }

  return neon(url);
}

module.exports = { getSql };
