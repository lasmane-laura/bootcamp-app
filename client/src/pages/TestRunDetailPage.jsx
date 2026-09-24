import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRun, updateRunResult } from '../api/test-runs';
import { createReport } from '../api/reports';
import SeverityBadge from '../components/SeverityBadge';

const RESULT_COLORS = {
  pending: '#777',
  passed: '#1a7f37',
  failed: '#a01c1c',
  skipped: '#8a7000',
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TestRunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [notesByCase, setNotesByCase] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyCaseId, setBusyCaseId] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    getRun(id)
      .then((data) => {
        setRun(data);
        const initialNotes = {};
        data.results.forEach((r) => {
          initialNotes[r.testCaseId] = r.notes || '';
        });
        setNotesByCase(initialNotes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSetResult(testCaseId, result) {
    setBusyCaseId(testCaseId);
    try {
      const data = await updateRunResult(id, testCaseId, { result, notes: notesByCase[testCaseId] || '' });
      setRun(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyCaseId(null);
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const report = await createReport(run.id);
      navigate(`/reports/${report.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingReport(false);
    }
  }

  if (loading) return <div >Loading...</div>;
  if (error && !run) return <div style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!run) return null;

  return (
    <div>
      <p>
        <Link to="/test-runs">← Back to test runs</Link>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>
          Run for <Link to={`/test-suites/${run.suiteId}`}>{run.suiteName}</Link>
        </h1>
        <button className="btn-secondary" disabled={generatingReport} onClick={handleGenerateReport} style={{ flexShrink: 0 }}>
          Generate report
        </button>
      </div>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Status: <strong>{run.status}</strong> &middot; Pass: <strong style={{ color: RESULT_COLORS.passed }}>{run.passCount}</strong>{' '}
        &middot; Fail: <strong style={{ color: RESULT_COLORS.failed }}>{run.failCount}</strong> &middot; Skip:{' '}
        <strong style={{ color: RESULT_COLORS.skipped }}>{run.skipCount}</strong>
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
        Started {new Date(run.startTime).toLocaleString()}
        {run.endTime ? ` · Ended ${new Date(run.endTime).toLocaleString()}` : ''}
      </p>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {run.results.map((r) => (
          <li key={r.id} style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1, fontWeight: 500 }}>{r.title}</span>
              <SeverityBadge severity={r.severity} />
              <span style={{ color: RESULT_COLORS[r.result], fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>
                {r.result}
              </span>
            </div>

            <input
              aria-label={`Notes for "${r.title}"`}
              placeholder="Notes (shown in Discord alert if this fails)..."
              value={notesByCase[r.testCaseId] || ''}
              onChange={(e) => setNotesByCase((prev) => ({ ...prev, [r.testCaseId]: e.target.value }))}
              style={{ width: '100%', marginBottom: '0.5rem', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-result btn-result-pass"
                disabled={busyCaseId === r.testCaseId}
                onClick={() => handleSetResult(r.testCaseId, 'passed')}
              >
                Pass
              </button>
              <button
                className="btn-result btn-result-fail"
                disabled={busyCaseId === r.testCaseId}
                onClick={() => handleSetResult(r.testCaseId, 'failed')}
              >
                Fail
              </button>
              <button
                className="btn-result btn-result-skip"
                disabled={busyCaseId === r.testCaseId}
                onClick={() => handleSetResult(r.testCaseId, 'skipped')}
              >
                Skip
              </button>
              {r.alertSent && (
                <span
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.8rem',
                    alignSelf: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <BellIcon /> Discord alert sent
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const rowStyle = {
  padding: '0.75rem',
  marginBottom: '0.5rem',
  border: '1px solid var(--border)',
  borderRadius: '6px',
};

export default TestRunDetailPage;
