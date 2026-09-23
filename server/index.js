const path = require('path');

try {
  process.loadEnvFile(path.join(__dirname, '../.env'));
} catch {
  // no .env file present — fine for endpoints that don't need it (e.g. Discord alerts are just skipped)
}

const express = require('express');
const seed = require('./seed');
const seedSuites = require('./seed-suites');
const seedBugs = require('./seed-bugs');
const seedTestRuns = require('./seed-test-runs');
const seedExtraTestRuns = require('./seed-test-runs-extra');
const seedReports = require('./seed-reports');
const seedSettings = require('./seed-settings');
const testCasesRouter = require('./routes/test-cases');
const testCasesImportRouter = require('./routes/test-cases-import');
const suitesRouter = require('./routes/suites');
const bugsRouter = require('./routes/bugs');
const bugAttachmentsRouter = require('./routes/bug-attachments');
const testRunsRouter = require('./routes/test-runs');
const dashboardRouter = require('./routes/dashboard');
const reportsRouter = require('./routes/reports');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

app.use('/api/test-cases/import', testCasesImportRouter);
app.use('/api/test-cases', testCasesRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/bugs/:bugId/attachments', bugAttachmentsRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/test-runs', testRunsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

seed();
seedSuites();
seedBugs();
seedTestRuns();
seedExtraTestRuns();
seedReports();
seedSettings();

// Serve the built client (client/dist) in production so this single service
// handles both the API and the frontend — the client's fetch calls use
// relative /api/... paths, so same-origin serving avoids needing CORS.
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
