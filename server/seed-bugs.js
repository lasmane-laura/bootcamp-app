const db = require('./db');

function seedBugs() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM bugs').get();
  if (count > 0) {
    console.log(`Skipping bug seed — bugs already has ${count} row(s).`);
    return;
  }

  const insertBug = db.prepare(
    `INSERT INTO bugs (title, description, severity, priority, status, steps, expected, actual, environment, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertActivity = db.prepare(
    'INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  const bug1Time = hoursAgo(2);
  const bug1 = insertBug.run(
    'Login page unresponsive on slow network',
    'On a throttled connection, the login form appears to hang after clicking Log in, with no loading indicator.',
    'Major',
    'High',
    'open',
    JSON.stringify(['Throttle the network to "Slow 3G" in dev tools.', 'Go to the Login page.', 'Enter valid credentials and click Log in.']),
    'A loading indicator appears while the request is in flight.',
    'The button appears to do nothing for several seconds with no visual feedback.',
    'Chrome 128, macOS, Slow 3G throttling',
    bug1Time,
    bug1Time
  );

  const bug2Created = hoursAgo(30);
  const bug2InProgress = hoursAgo(20);
  const bug2 = insertBug.run(
    'Checkout total miscalculates when discount code applied twice',
    'Applying the same discount code twice stacks the discount instead of rejecting the second attempt.',
    'Critical',
    'Urgent',
    'in-progress',
    JSON.stringify(['Add an item to the cart.', 'Go to checkout.', 'Enter a valid discount code and apply it.', 'Apply the same code again.']),
    'The second attempt is rejected with a message that the code was already applied.',
    'The discount is applied twice, halving the order total.',
    'Firefox 130, Windows 11',
    bug2Created,
    bug2InProgress
  );
  insertActivity.run(bug2.lastInsertRowid, 'status_change', 'open', 'in-progress', 'Investigating; can reproduce with two stacked codes.', bug2InProgress);

  const bug3Created = hoursAgo(72);
  const bug3InProgress = hoursAgo(50);
  const bug3Resolved = hoursAgo(5);
  const bug3 = insertBug.run(
    'Profile picture upload fails silently for HEIC files',
    'Uploading a HEIC photo from an iPhone does nothing — no error, no upload, no change to the avatar.',
    'Minor',
    'Low',
    'resolved',
    JSON.stringify(['Go to the Profile page.', 'Click Change avatar.', 'Select a .heic photo.', 'Click Upload.']),
    'The photo uploads, or a clear error explains the format is unsupported.',
    'Nothing happens; no error is shown and the avatar is unchanged.',
    'Safari 17, iOS 17',
    bug3Created,
    bug3Resolved
  );
  insertActivity.run(
    bug3.lastInsertRowid,
    'status_change',
    'open',
    'in-progress',
    'Assigned to dev, root cause found: HEIC not in the client-side mime whitelist.',
    bug3InProgress
  );
  insertActivity.run(
    bug3.lastInsertRowid,
    'status_change',
    'in-progress',
    'resolved',
    'Added HEIC to accepted formats and added a server-side fallback conversion.',
    bug3Resolved
  );

  console.log('Seeded 3 bugs.');
}

module.exports = seedBugs;

if (require.main === module) {
  seedBugs();
}
