const express = require('express');
const db = require('../db');

const router = express.Router();

const THEMES = ['light', 'dark', 'system'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PAGE_SIZES = [10, 20, 50, 100];

function ensureRow() {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO user_preferences (id, theme, default_severity_for_new_bugs, default_page_size, timezone, auto_generate_report_after_run, updated_at)
     VALUES (1, 'system', 'Minor', 20, NULL, 1, ?)`
  ).run(now);
}

function serialize(row) {
  return {
    theme: row.theme,
    defaultSeverityForNewBugs: row.default_severity_for_new_bugs,
    defaultPageSize: row.default_page_size,
    timezone: row.timezone,
    autoGenerateReportAfterRun: !!row.auto_generate_report_after_run,
    updatedAt: row.updated_at,
  };
}

function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function validate(body) {
  const errors = [];
  const { theme, defaultSeverityForNewBugs, defaultPageSize, timezone, autoGenerateReportAfterRun } = body;

  if (!THEMES.includes(theme)) errors.push(`theme must be one of ${THEMES.join(', ')}`);
  if (!SEVERITIES.includes(defaultSeverityForNewBugs)) {
    errors.push(`defaultSeverityForNewBugs must be one of ${SEVERITIES.join(', ')}`);
  }
  if (!PAGE_SIZES.includes(defaultPageSize)) {
    errors.push(`defaultPageSize must be one of ${PAGE_SIZES.join(', ')}`);
  }
  if (typeof timezone !== 'string' || !timezone.trim()) {
    errors.push('timezone is required');
  } else if (!isValidTimezone(timezone.trim())) {
    errors.push('timezone is not a recognized timezone');
  }
  if (typeof autoGenerateReportAfterRun !== 'boolean') {
    errors.push('autoGenerateReportAfterRun must be a boolean');
  }

  return errors;
}

function handleGetSettings(req, res) {
  ensureRow();
  const row = db.prepare('SELECT * FROM user_preferences WHERE id = 1').get();
  res.json({ success: true, data: serialize(row), error: null });
}

function handlePutSettings(req, res) {
  ensureRow();

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const { theme, defaultSeverityForNewBugs, defaultPageSize, timezone, autoGenerateReportAfterRun } = req.body;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE user_preferences
     SET theme = ?, default_severity_for_new_bugs = ?, default_page_size = ?, timezone = ?, auto_generate_report_after_run = ?, updated_at = ?
     WHERE id = 1`
  ).run(theme, defaultSeverityForNewBugs, defaultPageSize, timezone.trim(), autoGenerateReportAfterRun ? 1 : 0, now);

  const row = db.prepare('SELECT * FROM user_preferences WHERE id = 1').get();
  res.json({ success: true, data: serialize(row), error: null });
}

router.get('/', handleGetSettings);
router.put('/', handlePutSettings);

module.exports = router;
