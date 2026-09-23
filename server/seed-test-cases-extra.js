const db = require('./db');

const SEED_CASES = [
  // Checkout & payment
  {
    title: 'User completes checkout with a valid credit card',
    preconditions: 'User has at least one item in the cart and is on the Checkout page.',
    steps: ['Enter a valid credit card number in the Card number field.', 'Enter a valid expiry date and CVC.', 'Click the Place order button.'],
    expectedResult: 'The order is placed successfully and a confirmation page with the order number is shown.',
    severity: 'Critical',
    status: 'passed',
  },
  {
    title: 'Checkout rejects an expired credit card',
    preconditions: 'User has at least one item in the cart and is on the Checkout page.',
    steps: ['Enter a credit card number with an expiry date in the past.', 'Click the Place order button.'],
    expectedResult: 'An error message states the card has expired and the order is not placed.',
    severity: 'Critical',
    status: 'ready',
  },
  {
    title: 'User applies a valid discount code at checkout',
    preconditions: 'User is on the Checkout page and has an active discount code.',
    steps: ['Enter the discount code in the Promo code field.', 'Click the Apply button.'],
    expectedResult: 'The order total updates to reflect the discount and a confirmation message appears.',
    severity: 'Major',
    status: 'draft',
  },
  {
    title: 'Checkout blocks submission when the shipping address is incomplete',
    preconditions: 'User is on the Checkout page with an empty shipping address.',
    steps: ['Leave the Street address field blank.', 'Click the Place order button.'],
    expectedResult: 'An inline error appears under the Street address field and the order is not submitted.',
    severity: 'Major',
    status: 'failed',
  },
  {
    title: 'Order confirmation email is sent after successful checkout',
    preconditions: "User has just completed a successful checkout.",
    steps: ["Open the inbox for the account's registered email address."],
    expectedResult: 'An order confirmation email arrives within 5 minutes containing the order number.',
    severity: 'Minor',
    status: 'skipped',
  },

  // Search & filtering
  {
    title: 'User searches for a product by exact name',
    preconditions: 'User is on any page with the search bar visible.',
    steps: ['Enter the exact name of an existing product in the search bar.', 'Press Enter.'],
    expectedResult: 'The matching product appears as the first search result.',
    severity: 'Major',
    status: 'passed',
  },
  {
    title: 'Search returns no results message for an unmatched query',
    preconditions: 'User is on any page with the search bar visible.',
    steps: ['Enter a random string that matches no product in the search bar.', 'Press Enter.'],
    expectedResult: 'A "No results found" message is displayed.',
    severity: 'Minor',
    status: 'ready',
  },
  {
    title: 'User filters product results by price range',
    preconditions: 'User is on the search results page with more than one result.',
    steps: ['Open the Price filter panel.', 'Set a minimum and maximum price.', 'Click the Apply filter button.'],
    expectedResult: 'Only products within the selected price range are shown.',
    severity: 'Major',
    status: 'draft',
  },
  {
    title: 'User sorts search results by newest first',
    preconditions: 'User is on the search results page with more than one result.',
    steps: ['Open the Sort by dropdown.', 'Select the Newest option.'],
    expectedResult: 'Results reorder with the most recently added product listed first.',
    severity: 'Minor',
    status: 'failed',
  },
  {
    title: 'Search input trims leading and trailing whitespace',
    preconditions: 'User is on any page with the search bar visible.',
    steps: ['Enter a product name in the search bar with extra spaces before and after it.', 'Press Enter.'],
    expectedResult: 'The search still returns the matching product as if no extra spaces were entered.',
    severity: 'Trivial',
    status: 'skipped',
  },

  // Notifications
  {
    title: 'User receives a notification when an order ships',
    preconditions: 'User has an order that is ready to ship.',
    steps: ['Mark the order as shipped from the admin panel.', 'Open the notification bell as the customer.'],
    expectedResult: 'A new notification appears stating the order has shipped.',
    severity: 'Major',
    status: 'passed',
  },
  {
    title: 'User can mark a notification as read',
    preconditions: 'User has at least one unread notification.',
    steps: ['Open the notification list.', 'Click the unread notification.'],
    expectedResult: 'The notification is marked as read and its unread indicator disappears.',
    severity: 'Minor',
    status: 'ready',
  },
  {
    title: 'Notification badge count decreases after reading a notification',
    preconditions: 'User has 2 or more unread notifications.',
    steps: ['Note the current notification badge count.', 'Open and read one notification.'],
    expectedResult: 'The badge count decreases by exactly one.',
    severity: 'Minor',
    status: 'draft',
  },
  {
    title: 'User can disable email notifications from settings',
    preconditions: 'User is logged in and on the Settings page.',
    steps: ['Toggle off the Email notifications switch.', 'Click the Save button.'],
    expectedResult: 'The setting is saved and no further email notifications are sent.',
    severity: 'Major',
    status: 'failed',
  },
  {
    title: 'Notification list loads the next page on scroll',
    preconditions: 'User has more notifications than fit on one page.',
    steps: ['Open the notification list.', 'Scroll to the bottom of the list.'],
    expectedResult: 'The next page of older notifications loads automatically.',
    severity: 'Minor',
    status: 'skipped',
  },

  // Admin & user management
  {
    title: 'Admin can deactivate a user account',
    preconditions: 'Admin is logged in and on the User management page.',
    steps: ['Find an active user in the user list.', 'Click the Deactivate button for that user.', 'Confirm the action in the dialog.'],
    expectedResult: "The user's status changes to Deactivated in the list.",
    severity: 'Critical',
    status: 'passed',
  },
  {
    title: 'Deactivated user cannot log in',
    preconditions: 'A user account has been deactivated by an admin.',
    steps: ['Go to the Login page.', "Enter the deactivated account's credentials.", 'Click the Login button.'],
    expectedResult: 'An error message states the account is deactivated and login is blocked.',
    severity: 'Critical',
    status: 'ready',
  },
  {
    title: "Admin can change a user's role to Moderator",
    preconditions: 'Admin is logged in and on the User management page.',
    steps: ["Open an existing user's profile.", 'Change the Role dropdown to Moderator.', 'Click the Save button.'],
    expectedResult: "The user's role updates to Moderator and is reflected in the user list.",
    severity: 'Major',
    status: 'draft',
  },
  {
    title: 'Admin search finds a user by email',
    preconditions: 'Admin is logged in and on the User management page.',
    steps: ["Enter a registered user's email address in the search field.", 'Press Enter.'],
    expectedResult: 'The matching user account appears in the results list.',
    severity: 'Minor',
    status: 'failed',
  },
  {
    title: 'Admin action log records a role change',
    preconditions: "Admin has just changed a user's role.",
    steps: ['Open the Action log page.', 'Locate the most recent entry.'],
    expectedResult: 'The log shows an entry recording the role change, the admin who made it, and a timestamp.',
    severity: 'Minor',
    status: 'skipped',
  },
];

function seedExtraTestCases() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM test_cases WHERE title = ?').get(SEED_CASES[0].title);
  if (existing.count > 0) {
    console.log('Skipping extra test case seed — already present.');
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

  console.log(`Seeded ${SEED_CASES.length} extra test cases.`);
}

module.exports = seedExtraTestCases;

if (require.main === module) {
  seedExtraTestCases();
}
