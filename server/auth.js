const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'dekon_token';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// Optional auth: attaches req.user if a valid session exists.
function authOptional(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return next();
  }
  db.prepare('SELECT id, name, email, avatar_url FROM users WHERE id = ?')
    .get(payload.sub)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch(next);
}

// Require auth: rejects unauthenticated requests.
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  authOptional,
  requireAuth,
};
