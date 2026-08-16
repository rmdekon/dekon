require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const db = require('./db');
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  authOptional,
  requireAuth,
} = require('./auth');

const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({ origin: APP_URL, credentials: true }));

// Make sure the database schema exists before handling requests (important for
// serverless cold starts). Safe to run on every boot — it creates IF NOT EXISTS.
let ready = db.initSchema();
app.use(async (req, res, next) => {
  try { await ready; next(); }
  catch (err) { next(err); }
});

// --- Static frontend (served locally; Vercel serves public/ directly too) ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
const DEFAULT_BUDGETS = [
  { category: 'Food & Chop Money', limit: 2500.00 },
  { category: 'Transport / Trotro', limit: 1200.00 },
  { category: 'Rent & Utilities', limit: 4000.00 },
  { category: 'Momo Charges & Fees', limit: 800.00 },
  { category: 'Entertainment & Fun', limit: 1500.00 },
  { category: 'Loan Repayment', limit: 2000.00 },
  { category: 'Miscellaneous', limit: 1500.00 },
];

async function seedUserData(userId) {
  const hasBudg = await db.prepare('SELECT 1 FROM budgets WHERE user_id = ?').get(userId);
  if (!hasBudg) {
    const insertB = db.prepare(
      `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)`
    );
    for (const b of DEFAULT_BUDGETS) {
      await insertB.run(userId, b.category, b.limit);
    }
  }
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url };
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.get('/api/auth/me', authOptional, (req, res) => {
  res.json({
    user: req.user ? publicUser(req.user) : null,
    googleEnabled: GOOGLE_ENABLED,
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now(), db: db.dialect }));

app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }
  const password_hash = await bcrypt.hash(password, 10);
  const info = await db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(String(name).trim(), normalizedEmail, password_hash);
  const user = await db
    .prepare('SELECT id, name, email, avatar_url FROM users WHERE id = ?')
    .get(info.lastInsertRowid);
  await seedUserData(user.id);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  const invalid = 'Invalid email or password.';
  if (!user || !user.password_hash) return res.status(401).json({ error: invalid });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: invalid });
  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Google OAuth
if (GOOGLE_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${APP_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error('Google account has no email.'));
          let user = await db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
          if (!user) {
            user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
          }
          if (!user) {
            const info = await db
              .prepare(`INSERT INTO users (name, email, google_id, avatar_url) VALUES (?, ?, ?, ?)`)
              .run(
                profile.displayName || email.split('@')[0],
                email,
                profile.id,
                profile.photos?.[0]?.value || null
              );
            user = await db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
            await seedUserData(user.id);
          } else if (!user.google_id || !user.avatar_url) {
            await db
              .prepare('UPDATE users SET google_id = COALESCE(google_id, ?), avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
              .run(profile.id, profile.photos?.[0]?.value || null, user.id);
          }
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/?auth=google-failed' }),
    (req, res) => {
      setAuthCookie(res, signToken(req.user));
      res.redirect('/?auth=google-success');
    }
  );
} else {
  app.get('/api/auth/google', (_req, res) => {
    res
      .status(503)
      .send(
        '<h1>Google sign-in is not configured</h1>' +
          '<p>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Vercel environment variables, then redeploy.</p>' +
          '<p><a href="/">Back to DEKON</a></p>'
      );
  });
}

// ---------------------------------------------------------------------------
// Data API
// ---------------------------------------------------------------------------
app.get('/api/state', authOptional, requireAuth, wrap(async (req, res) => {
  const transactions = await db
    .prepare('SELECT id, date, description, type, category, amount FROM transactions WHERE user_id = ? ORDER BY date DESC')
    .all(req.user.id);
  const budgets = await db
    .prepare('SELECT category, limit_amount AS "limit" FROM budgets WHERE user_id = ?')
    .all(req.user.id);
  res.json({ transactions, budgets });
}));

app.post('/api/transactions', authOptional, requireAuth, wrap(async (req, res) => {
  const { id, date, description, type, category, amount } = req.body || {};
  if (!date || !description || !type || !category || amount == null) {
    return res.status(400).json({ error: 'Missing required transaction fields.' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be income or expense.' });
  }
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt < 0) return res.status(400).json({ error: 'Invalid amount.' });

  const txId = id || 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  await db
    .prepare(`INSERT INTO transactions (id, user_id, date, description, type, category, amount) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(txId, req.user.id, date, String(description), type, String(category), amt);
  res.status(201).json({ id: txId, date, description, type, category, amount: amt });
}));

app.delete('/api/transactions/:id', authOptional, requireAuth, wrap(async (req, res) => {
  await db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

app.delete('/api/transactions', authOptional, requireAuth, wrap(async (req, res) => {
  await db.prepare('DELETE FROM transactions WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
}));

app.put('/api/budgets', authOptional, requireAuth, wrap(async (req, res) => {
  const { budgets } = req.body || {};
  if (!Array.isArray(budgets)) {
    return res.status(400).json({ error: 'budgets must be an array.' });
  }
  await db.prepare('DELETE FROM budgets WHERE user_id = ?').run(req.user.id);
  const upsert = db.prepare(
    `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)
     ON CONFLICT(user_id, category) DO UPDATE SET limit_amount = excluded.limit_amount`
  );
  for (const b of budgets) {
    if (b && b.category && Number(b.limit) >= 0) {
      await upsert.run(req.user.id, String(b.category), Number(b.limit));
    }
  }
  const saved = await db
    .prepare('SELECT category, limit_amount AS "limit" FROM budgets WHERE user_id = ?')
    .all(req.user.id);
  res.json({ budgets: saved });
}));

app.delete('/api/account', authOptional, requireAuth, wrap(async (req, res) => {
  await db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  clearAuthCookie(res);
  res.json({ ok: true });
}));

// SPA fallback (non-API routes return the app shell)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
