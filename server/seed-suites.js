const db = require('./db');

function seedSuites() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM suites').get();
  if (count > 0) {
    console.log(`Skipping suite seed — suites already has ${count} row(s).`);
    return;
  }

  const caseIds = db.prepare('SELECT id FROM test_cases ORDER BY id ASC').all().map((r) => r.id);
  if (caseIds.length === 0) {
    console.log('Skipping suite seed — no test cases to link.');
    return;
  }

  const pick = (n) => caseIds.slice(0, n);
  const pickLast = (n) => caseIds.slice(-n);

  const now = new Date();
  const insertSuite = db.prepare('INSERT INTO suites (name, feature, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const insertCase = db.prepare('INSERT INTO suite_cases (suite_id, test_case_id, sort_order) VALUES (?, ?, ?)');

  const SUITES = [
    { name: 'Login & account smoke suite', feature: 'login', status: 'ready', caseIds: pick(3) },
    { name: 'Shopping & misc regression suite', feature: 'cart', status: 'draft', caseIds: pickLast(3) },
  ];

  SUITES.forEach((suite, i) => {
    const timestamp = new Date(now.getTime() - (SUITES.length - i) * 3600 * 1000).toISOString();
    const result = insertSuite.run(suite.name, suite.feature, suite.status, timestamp, timestamp);
    suite.caseIds.forEach((caseId, index) => insertCase.run(result.lastInsertRowid, caseId, index));
  });

  console.log(`Seeded ${SUITES.length} suites.`);
}

module.exports = seedSuites;

if (require.main === module) {
  seedSuites();
}
