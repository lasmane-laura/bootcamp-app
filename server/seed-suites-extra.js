const db = require('./db');

const SUITE_DEFS = [
  {
    name: 'Checkout & payment suite',
    feature: 'checkout',
    status: 'ready',
    titles: [
      'User completes checkout with a valid credit card',
      'Checkout rejects an expired credit card',
      'User applies a valid discount code at checkout',
      'Checkout blocks submission when the shipping address is incomplete',
      'Order confirmation email is sent after successful checkout',
    ],
  },
  {
    name: 'Search & filtering suite',
    feature: 'search',
    status: 'draft',
    titles: [
      'User searches for a product by exact name',
      'Search returns no results message for an unmatched query',
      'User filters product results by price range',
      'User sorts search results by newest first',
      'Search input trims leading and trailing whitespace',
    ],
  },
  {
    name: 'Notifications suite',
    feature: 'notifications',
    status: 'in-progress',
    titles: [
      'User receives a notification when an order ships',
      'User can mark a notification as read',
      'Notification badge count decreases after reading a notification',
      'User can disable email notifications from settings',
      'Notification list loads the next page on scroll',
    ],
  },
  {
    name: 'Admin & user management suite',
    feature: 'admin',
    status: 'ready',
    titles: [
      'Admin can deactivate a user account',
      'Deactivated user cannot log in',
      "Admin can change a user's role to Moderator",
      'Admin search finds a user by email',
      'Admin action log records a role change',
    ],
  },
];

function seedExtraSuites() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM suites WHERE name = ?').get(SUITE_DEFS[0].name);
  if (existing.count > 0) {
    console.log('Skipping extra suite seed — already present.');
    return;
  }

  const caseRows = db.prepare('SELECT id, title FROM test_cases').all();
  const idByTitle = new Map(caseRows.map((r) => [r.title, r.id]));

  const now = new Date();
  const insertSuite = db.prepare('INSERT INTO suites (name, feature, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const insertCase = db.prepare('INSERT INTO suite_cases (suite_id, test_case_id, sort_order) VALUES (?, ?, ?)');

  SUITE_DEFS.forEach((suite, i) => {
    const timestamp = new Date(now.getTime() - (SUITE_DEFS.length - i) * 3600 * 1000).toISOString();
    const result = insertSuite.run(suite.name, suite.feature, suite.status, timestamp, timestamp);
    suite.titles.forEach((title, index) => {
      const caseId = idByTitle.get(title);
      if (caseId) insertCase.run(result.lastInsertRowid, caseId, index);
    });
  });

  console.log(`Seeded ${SUITE_DEFS.length} extra suites.`);
}

module.exports = seedExtraSuites;

if (require.main === module) {
  seedExtraSuites();
}
