import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRuns } from '../api/test-runs';

function TestRunsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listRuns()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Test runs</h1>

      {error && <p style={{ color: '#a01c1c' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={thStyle}>Suite</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Pass</th>
              <th style={thStyle}>Fail</th>
              <th style={thStyle}>Skip</th>
              <th style={thStyle}>Started</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', color: '#777' }}>
                  No test runs yet.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <Link to={`/test-runs/${r.id}`}>{r.suiteName}</Link>
                </td>
                <td style={tdStyle}>{r.status}</td>
                <td style={{ ...tdStyle, color: '#1a7f37' }}>{r.passCount}</td>
                <td style={{ ...tdStyle, color: '#a01c1c' }}>{r.failCount}</td>
                <td style={{ ...tdStyle, color: '#777' }}>{r.skipCount}</td>
                <td style={tdStyle}>{new Date(r.startTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem' };
const tdStyle = { padding: '0.5rem' };

export default TestRunsPage;
