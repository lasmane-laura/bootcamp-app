const db = require('./db');

const SEED_CASES = [
  {
    title: 'User logs in with valid credentials',
    preconditions: 'User has an existing account and is on the Login page.',
    steps: ['Enter a valid email in the Email field.', 'Enter the correct password in the Password field.', 'Click the Login button.'],
    expectedResult: 'The user is redirected to the dashboard and sees their name in the header.',
    severity: 'Critical',
    status: 'passed',
  },
  {
    title: 'User resets a forgotten password',
    preconditions: 'User has an existing account and is on the Login page.',
    steps: ['Click the "Forgot password?" link.', 'Enter a registered email in the Email field.', 'Click the Send reset link button.'],
    expectedResult: 'A password reset email is sent and a confirmation message appears on screen.',
    severity: 'Major',
    status: 'ready',
  },
  {
    title: 'User adds an item to the cart',
    preconditions: 'User is on a product page for an in-stock item.',
    steps: ['Select a size from the size dropdown.', 'Click the Add to cart button.'],
    expectedResult: 'The cart icon count increases by one and a confirmation toast appears.',
    severity: 'Major',
    status: 'draft',
  },
  {
    title: 'Profile avatar upload rejects oversized files',
    preconditions: 'User is logged in and on the Profile page.',
    steps: ['Click the Change avatar button.', 'Select an image file larger than 5MB.', 'Click the Upload button.'],
    expectedResult: 'An error message appears stating the file exceeds the size limit and no upload occurs.',
    severity: 'Minor',
    status: 'failed',
  },
  {
    title: 'Footer copyright year is current',
    preconditions: '',
    steps: ['Scroll to the footer on any page.'],
    expectedResult: 'The copyright year shown matches the current year.',
    severity: 'Trivial',
    status: 'skipped',
  },
];

function seed() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get();
  if (count > 0) {
    console.log(`Skipping seed — test_cases already has ${count} row(s).`);
    return;
  }

  const now = new Date();
  const insert = db.prepare(
    `INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  SEED_CASES.forEach((tc, i) => {
    const timestamp = new Date(now.getTime() - (SEED_CASES.length - i) * 3600 * 1000).toISOString();
    insert.run(tc.title, tc.preconditions || null, JSON.stringify(tc.steps), tc.expectedResult, tc.severity, tc.status, timestamp, timestamp);
  });

  console.log(`Seeded ${SEED_CASES.length} test cases.`);
}

module.exports = seed;

if (require.main === module) {
  seed();
}
