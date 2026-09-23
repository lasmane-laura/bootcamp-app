const db = require('./db');

function seedSettings() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM user_preferences').get();
  if (count > 0) {
    console.log(`Skipping settings seed — user_preferences already has ${count} row(s).`);
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO user_preferences (id, theme, default_severity_for_new_bugs, default_page_size, timezone, auto_generate_report_after_run, updated_at)
     VALUES (1, 'system', 'Minor', 20, NULL, 1, ?)`
  ).run(now);

  console.log('Seeded default user preferences.');
}

module.exports = seedSettings;

if (require.main === module) {
  seedSettings();
}
