// Vercel serverless entry point. It imports the same Express app used locally
// and wraps it for Vercel's function runtime.
const serverless = require('serverless-http');
const app = require('../server/app');

// Ensure the database schema is ready before the first cold-start request.
app.prepare = async () => {
  const db = require('../server/db');
  await db.initSchema();
};

module.exports = serverless(app);
