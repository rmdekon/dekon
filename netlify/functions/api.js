// Netlify serverless function that runs the same Express app used locally
// and on Vercel. Netlify rewrites /api/* requests to this function.
const serverless = require('serverless-http');
const app = require('../../server/app');
const db = require('../../server/db');

const handler = serverless(app);
let schemaReady;

exports.handler = async (event, context) => {
  // Make sure tables exist (safe on cold starts).
  if (!schemaReady) schemaReady = db.initSchema();
  await schemaReady;

  // When Netlify rewrites /api/* to the function URL, the path the Express
  // app sees can be the internal /.netlify/functions/api/... prefix.
  // Normalize it so the /api/... routes match correctly.
  if (event.path) event.path = event.path.replace(/^\/\.netlify\/functions\/[^/]+/, '');
  if (event.rawPath) event.rawPath = event.rawPath.replace(/^\/\.netlify\/functions\/[^/]+/, '');

  return handler(event, context);
};
