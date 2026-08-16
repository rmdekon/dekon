// Local development entry point (Run with: npm start)
const app = require('./app');

const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  DEKON Finance Hub running at ${APP_URL}`);
  console.log(`  Database: ${require('./db').dialect}`);
  const g = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  console.log(`  Google sign-in: ${g ? 'enabled ✓' : 'disabled (add GOOGLE_* keys to enable)'}\n`);
});
