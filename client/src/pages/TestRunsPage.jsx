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
    <div>
      <h1>Test runs</h1>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Suite</th>
              <th>Status</th>
              <th>Pass</th>
              <th>Fail</th>
              <th>Skip</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', color: 'var(--muted)' }}>
                  No test runs yet.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/test-runs/${r.id}`}>{r.suiteName}</Link>
                </td>
                <td>{r.status}</td>
                <td style={{ color: 'var(--success)' }}>{r.passCount}</td>
                <td style={{ color: 'var(--danger)' }}>{r.failCount}</td>
                <td style={{ color: 'var(--muted)' }}>{r.skipCount}</td>
                <td>{new Date(r.startTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TestRunsPage;
