import { useEffect, useState } from 'react';
import { updateSettings } from '../api/settings';
import { useSettings } from '../context/SettingsContext';
import Select from '../components/Select';

const THEMES = ['light', 'dark', 'system'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PAGE_SIZES = [10, 20, 50, 100];

const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function getTimezoneOptions() {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      // supportedValuesOf('timeZone') omits legacy-but-valid identifiers like
      // 'UTC' (it only returns canonical IANA zone names) — Intl.DateTimeFormat
      // accepts 'UTC' fine, so add it explicitly or a stored 'UTC' preference
      // wouldn't match any <option> here and would silently show the wrong zone.
      return ['UTC', ...Intl.supportedValuesOf('timeZone')];
    }
  } catch {
    // fall through to fallback list
  }
  return FALLBACK_TIMEZONES;
}

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function SettingsPage() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [timezoneOptions] = useState(getTimezoneOptions);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        theme: settings.theme,
        defaultSeverityForNewBugs: settings.defaultSeverityForNewBugs,
        defaultPageSize: settings.defaultPageSize,
        timezone: settings.timezone || getBrowserTimezone(),
        autoGenerateReportAfterRun: settings.autoGenerateReportAfterRun,
      });
    }
  }, [settings, form]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateSettings(form);
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <form onSubmit={handleSave}>
        <div className="settings-card">
          <div className="settings-grid">
            <div className="settings-field">
              <label htmlFor="setting-theme">Theme</label>
              <Select id="setting-theme" value={form.theme} onChange={(e) => update('theme', e.target.value)}>
                {THEMES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="settings-field">
              <label htmlFor="setting-default-severity">Default severity for new bugs</label>
              <Select
                id="setting-default-severity"
                value={form.defaultSeverityForNewBugs}
                onChange={(e) => update('defaultSeverityForNewBugs', e.target.value)}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="settings-field">
              <label htmlFor="setting-page-size">Default page size</label>
              <Select
                id="setting-page-size"
                value={form.defaultPageSize}
                onChange={(e) => update('defaultPageSize', Number(e.target.value))}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>

            <div className="settings-field">
              <label htmlFor="setting-timezone">Timezone</label>
              <Select id="setting-timezone" value={form.timezone} onChange={(e) => update('timezone', e.target.value)}>
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="settings-toggle-row">
            <input
              id="setting-auto-report"
              type="checkbox"
              checked={form.autoGenerateReportAfterRun}
              onChange={(e) => update('autoGenerateReportAfterRun', e.target.checked)}
            />
            <label htmlFor="setting-auto-report">Automatically generate a report after a test run completes</label>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <span style={{ color: 'var(--success)' }}>Saved</span>}
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
