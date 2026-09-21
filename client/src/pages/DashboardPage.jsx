import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../api/dashboard';

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
    getDashboardMetrics()
      .then((result) => {
        setData(result);
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
      <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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
      <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>Dashboard</h1>
        <p style={{ color: '#a01c1c' }}>Failed to load dashboard: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  if (isEmptyDashboard(data)) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>Dashboard</h1>
        <p style={{ color: '#777', marginBottom: '0.5rem' }}>
          Nothing here yet — this fills in once you've got some data to show.
        </p>
        <p style={{ color: '#777' }}>
          Start with <Link to="/test-cases">creating a test case</Link>, then{' '}
          <Link to="/test-suites">build a suite</Link> and run it, or <Link to="/bugs">log a bug</Link>.
        </p>
      </div>
    );
  }

  const { metrics, recentRuns, recentActivity } = data;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Dashboard</h1>

      {error && (
        <p style={{ color: '#a01c1c', fontSize: '0.85rem' }}>
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
        <h2>Recent test runs</h2>
        {recentRuns.length === 0 ? (
          <p style={{ color: '#777' }}>
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
                  <td style={{ ...tdStyle, color: '#1a7f37' }}>{r.passCount}</td>
                  <td style={{ ...tdStyle, color: '#a01c1c' }}>{r.failCount}</td>
                  <td style={{ ...tdStyle, color: '#777' }}>{r.skipCount}</td>
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
          <p style={{ color: '#777' }}>
            No activity yet — updating a <Link to="/bugs">bug's</Link> status or adding a comment will show up here.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentActivity.map((a) => (
              <li key={a.id} style={activityItemStyle}>
                <Link to={`/bugs/${a.bugId}`}>{a.summary}</Link>
                <span style={{ color: '#999', fontSize: '0.8rem' }}>{new Date(a.createdAt).toLocaleString()}</span>
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
      <div style={{ color: '#777', fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

const metricCardStyle = {
  flex: '1 1 180px',
  padding: '1rem',
  border: '1px solid #eee',
  borderRadius: '8px',
  background: '#fafafa',
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
