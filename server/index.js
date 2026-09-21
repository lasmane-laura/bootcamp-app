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
const seedReports = require('./seed-reports');
const testCasesRouter = require('./routes/test-cases');
const suitesRouter = require('./routes/suites');
const bugsRouter = require('./routes/bugs');
const testRunsRouter = require('./routes/test-runs');
const dashboardRouter = require('./routes/dashboard');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

app.use('/api/test-cases', testCasesRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/test-runs', testRunsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

seed();
seedSuites();
seedBugs();
seedTestRuns();
seedReports();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
