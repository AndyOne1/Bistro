// netlify/functions/_auth.js
// Simple auth helpers using JWT.
// Configure process.env.AUTH_SECRET to a strong secret in Netlify site settings.

const jwt = require('jsonwebtoken');

const SECRET = process.env.AUTH_SECRET || 'replace-me-with-a-strong-secret';
const DEFAULT_EXPIRES = '7d';

function sign(payload, options = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: options.expiresIn || DEFAULT_EXPIRES });
}

function verify(token) {
  if (!token) return null;
  try {
    // accept both "Bearer <token>" and raw token
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    return jwt.verify(raw, SECRET);
  } catch (err) {
    return null;
  }
}

// Helper to extract token from Netlify Functions event headers
function fromEvent(event) {
  const auth = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!auth) return null;
  return verify(auth);
}

module.exports = { sign, verify, fromEvent };
