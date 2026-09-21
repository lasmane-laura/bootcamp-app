const express = require('express');
const seed = require('./seed');
const seedSuites = require('./seed-suites');
const seedBugs = require('./seed-bugs');
const testCasesRouter = require('./routes/test-cases');
const suitesRouter = require('./routes/suites');
const bugsRouter = require('./routes/bugs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

app.use('/api/test-cases', testCasesRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/bugs', bugsRouter);

seed();
seedSuites();
seedBugs();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
