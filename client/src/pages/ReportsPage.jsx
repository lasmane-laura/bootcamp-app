import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReports } from '../api/reports';

function ReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listReports()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Reports</h1>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Suite</th>
              <th>Run date</th>
              <th>Total</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Skipped</th>
              <th>Generated</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '1rem', color: 'var(--muted)' }}>
                  No reports yet.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/reports/${r.id}`}>{r.suiteName}</Link>
                </td>
                <td>{new Date(r.runDate).toLocaleString()}</td>
                <td>{r.totalCount}</td>
                <td style={{ color: 'var(--success)' }}>{r.passedCount}</td>
                <td style={{ color: 'var(--danger)' }}>{r.failedCount}</td>
                <td style={{ color: 'var(--warning)' }}>{r.skippedCount}</td>
                <td>{new Date(r.generatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ReportsPage;
