import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport, reportHtmlExportUrl } from '../api/reports';
import SeverityBadge from '../components/SeverityBadge';

const RESULT_COLORS = {
  pending: '#777',
  passed: '#1a7f37',
  failed: '#a01c1c',
  skipped: '#8a7000',
};

function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    getReport(id)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handlePrint() {
    setPrinting(true);
    try {
      const win = window.open(reportHtmlExportUrl(id, { inline: true }), '_blank');
      if (!win) {
        setError('Pop-up blocked. Please allow pop-ups to print this report.');
        return;
      }
      win.onload = () => win.print();
    } catch (err) {
      setError(err.message);
    } finally {
      setPrinting(false);
    }
  }

  if (loading) return <div >Loading...</div>;
  if (error && !report) return <div style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!report) return null;

  return (
    <div>
      <p>
        <Link to="/reports">← Back to reports</Link>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Report for {report.suiteName}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>
            Run date {new Date(report.runDate).toLocaleString()} &middot; Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <a href={reportHtmlExportUrl(report.id)} download={`report-${report.id}.html`} className="btn-secondary">
            Download HTML
          </a>
          <button className="btn-secondary" disabled={printing} onClick={handlePrint}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <p style={{ color: 'var(--muted)' }}>
        Total: <strong>{report.totalCount}</strong> &middot; Passed:{' '}
        <strong style={{ color: RESULT_COLORS.passed }}>{report.passedCount}</strong> &middot; Failed:{' '}
        <strong style={{ color: RESULT_COLORS.failed }}>{report.failedCount}</strong> &middot; Skipped:{' '}
        <strong style={{ color: RESULT_COLORS.skipped }}>{report.skippedCount}</strong>
      </p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {report.results.map((r) => (
          <li key={r.testCaseId} style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{r.title}</span>
              <SeverityBadge severity={r.severity} />
              <span style={{ color: RESULT_COLORS[r.result], fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>
                {r.result}
              </span>
            </div>
            {r.notes && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{r.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const rowStyle = {
  padding: '0.75rem',
  marginBottom: '0.5rem',
  border: '1px solid #eee',
  borderRadius: '6px',
};

export default ReportDetailPage;
