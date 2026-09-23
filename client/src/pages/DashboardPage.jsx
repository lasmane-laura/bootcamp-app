import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, getDashboardTrends } from '../api/dashboard';
import PassRateTrendChart from '../components/charts/PassRateTrendChart';
import BugsPerWeekChart from '../components/charts/BugsPerWeekChart';
import TestCoverageDonutChart from '../components/charts/TestCoverageDonutChart';

const REFRESH_INTERVAL_MS = 30000;

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function isEmptyDashboard(data) {
  return (
    data.metrics.totalTestCases === 0 && data.recentRuns.length === 0 && data.recentActivity.length === 0
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasLoadedOnce = useRef(false);

  function load() {
    if (!hasLoadedOnce.current) setLoading(true);
    Promise.all([getDashboardMetrics(), getDashboardTrends()])
      .then(([metricsResult, trends]) => {
        setData({ ...metricsResult, trends });
        setError('');
        hasLoadedOnce.current = true;
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={skeletonCardStyle} />
          ))}
        </div>
        <div style={{ ...skeletonBlockStyle, height: '200px', marginBottom: '2rem' }} />
        <div style={{ ...skeletonBlockStyle, height: '200px' }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--danger)' }}>Failed to load dashboard: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  if (isEmptyDashboard(data)) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
          Nothing here yet — this fills in once you've got some data to show.
        </p>
        <p style={{ color: 'var(--muted)' }}>
          Start with <Link to="/test-cases">creating a test case</Link>, then{' '}
          <Link to="/test-suites">build a suite</Link> and run it, or <Link to="/bugs">log a bug</Link>.
        </p>
      </div>
    );
  }

  const { metrics, recentRuns, recentActivity, trends } = data;

  return (
    <div>
      <h1>Dashboard</h1>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
          Last refresh failed ({error}) — showing previously loaded data.
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <MetricCard label="Total test cases" value={metrics.totalTestCases} />
        <MetricCard
          label="Pass rate"
          value={metrics.passRate === null ? '—' : `${metrics.passRate}%`}
          hint={metrics.passRate === null ? 'Run a test suite to start tracking this' : undefined}
        />
        <MetricCard label="Open bugs" value={metrics.openBugs} />
        <MetricCard
          label="Avg run duration"
          value={formatDuration(metrics.avgTestRunDurationSeconds)}
          hint={metrics.avgTestRunDurationSeconds === null ? 'No completed test runs yet' : undefined}
        />
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Trends</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <ChartCard title="Pass rate trend" subtitle="Last 10 test runs">
            <PassRateTrendChart data={trends.passRateTrend} />
          </ChartCard>
          <ChartCard title="Bugs opened vs. closed" subtitle="Last 8 weeks">
            <BugsPerWeekChart data={trends.bugsPerWeek} />
          </ChartCard>
          <ChartCard title="Test coverage by status" subtitle="All test cases">
            <TestCoverageDonutChart data={trends.testCoverageByStatus} />
          </ChartCard>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Recent test runs</h2>
        {recentRuns.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>
            No test runs yet — <Link to="/test-suites">pick a suite</Link> and start one to see results here.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle}>Suite</th>
                <th style={thStyle}>Pass</th>
                <th style={thStyle}>Fail</th>
                <th style={thStyle}>Skip</th>
                <th style={thStyle}>When</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>
                    <Link to={`/test-runs/${r.id}`}>{r.suiteName}</Link>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--success)' }}>{r.passCount}</td>
                  <td style={{ ...tdStyle, color: 'var(--danger)' }}>{r.failCount}</td>
                  <td style={{ ...tdStyle, color: 'var(--muted)' }}>{r.skipCount}</td>
                  <td style={tdStyle}>{new Date(r.startTime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>
            No activity yet — updating a <Link to="/bugs">bug's</Link> status or adding a comment will show up here.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentActivity.map((a) => (
              <li key={a.id} style={activityItemStyle}>
                <Link to={`/bugs/${a.bugId}`}>{a.summary}</Link>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(a.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div style={metricCardStyle} title={hint}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={chartCardStyle}>
      <h3 style={{ margin: '0 0 0.1rem', fontSize: '1rem' }}>{title}</h3>
      {/* fixed (not themed) — this card is a light island, see chartCardStyle comment */}
      <p style={{ margin: '0 0 0.75rem', color: '#767676', fontSize: '0.8rem' }}>{subtitle}</p>
      {children}
    </div>
  );
}

const metricCardStyle = {
  flex: '1 1 180px',
  padding: '1rem',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--input-bg)',
  color: 'var(--text)',
};

// The trend charts below render assuming a fixed light canvas (axes, gridlines,
// tooltips) — reworking that for dark mode is a chart-redesign, not a low-hanging
// fruit fix, so this card is a deliberate "light island": pin dark, readable text
// on its own white surface instead of inheriting the page's (light-in-dark-mode)
// text color, which would otherwise go near-invisible on this hardcoded white bg.
const chartCardStyle = {
  padding: '1rem',
  border: '1px solid #eee',
  borderRadius: '8px',
  background: '#fff',
  color: '#1a1a1a',
};

const skeletonCardStyle = {
  ...metricCardStyle,
  height: '64px',
  background: '#eee',
};

const skeletonBlockStyle = {
  width: '100%',
  borderRadius: '8px',
  background: '#eee',
};

const thStyle = { padding: '0.5rem' };
const tdStyle = { padding: '0.5rem' };

const activityItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.5rem 0',
  borderBottom: '1px solid #eee',
};

export default DashboardPage;
