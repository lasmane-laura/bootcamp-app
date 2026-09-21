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
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Reports</h1>

      {error && <p style={{ color: '#a01c1c' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={thStyle}>Suite</th>
              <th style={thStyle}>Run date</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Passed</th>
              <th style={thStyle}>Failed</th>
              <th style={thStyle}>Skipped</th>
              <th style={thStyle}>Generated</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '1rem', color: '#777' }}>
                  No reports yet.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <Link to={`/reports/${r.id}`}>{r.suiteName}</Link>
                </td>
                <td style={tdStyle}>{new Date(r.runDate).toLocaleString()}</td>
                <td style={tdStyle}>{r.totalCount}</td>
                <td style={{ ...tdStyle, color: '#1a7f37' }}>{r.passedCount}</td>
                <td style={{ ...tdStyle, color: '#a01c1c' }}>{r.failedCount}</td>
                <td style={{ ...tdStyle, color: '#8a7000' }}>{r.skippedCount}</td>
                <td style={tdStyle}>{new Date(r.generatedAt).toLocaleString()}</td>
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

export default ReportsPage;
