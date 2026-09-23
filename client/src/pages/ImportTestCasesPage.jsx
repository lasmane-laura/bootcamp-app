import { useState } from 'react';
import { Link } from 'react-router-dom';
import { previewImportTestCases, commitImportTestCases } from '../api/test-cases';
import SeverityBadge from '../components/SeverityBadge';

function ImportTestCasesPage() {
  const [phase, setPhase] = useState('idle');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0] || null);
    setError('');
  }

  async function handlePreviewImport() {
    if (!file) {
      setError('Choose a CSV file first.');
      return;
    }
    setPhase('previewing');
    setError('');
    try {
      const data = await previewImportTestCases(file);
      setPreviewRows(data.rows);
      setPhase('preview-ready');
    } catch (err) {
      setError(err.message);
      setPhase('idle');
    }
  }

  async function handleCommitImport() {
    const validRows = previewRows.filter((r) => r.valid).map((r) => r.data);
    setPhase('importing');
    setError('');
    try {
      const data = await commitImportTestCases(validRows);
      setResult(data);
      setPhase('done');
    } catch (err) {
      setError(err.message);
      setPhase('preview-ready');
    }
  }

  function handleReset() {
    setFile(null);
    setPreviewRows([]);
    setResult(null);
    setError('');
    setPhase('idle');
  }

  const validCount = previewRows.filter((r) => r.valid).length;
  const invalidCount = previewRows.length - validCount;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Import test cases</h1>
        <Link to="/test-cases">Back to test cases</Link>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {(phase === 'idle' || phase === 'previewing') && (
        <div>
          <p style={{ color: 'var(--muted)' }}>
            Choose a CSV file with columns <code>title</code>, <code>steps</code>, <code>expectedResult</code>,{' '}
            <code>severity</code> (required), plus optional <code>preconditions</code>, <code>status</code>.
            Multiple steps in one cell can be separated by newlines or <code>|</code>.
          </p>
          <input
            type="file"
            aria-label="Choose a CSV file to import"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={phase === 'previewing'}
          />
          <div style={{ marginTop: '1rem' }}>
            <button className="btn-primary" onClick={handlePreviewImport} disabled={!file || phase === 'previewing'}>
              {phase === 'previewing' ? 'Uploading...' : 'Upload & preview'}
            </button>
          </div>
        </div>
      )}

      {(phase === 'preview-ready' || phase === 'importing') && (
        <div>
          <p>
            {previewRows.length} row{previewRows.length === 1 ? '' : 's'}:{' '}
            <span style={{ color: 'var(--success)' }}>{validCount} valid</span>,{' '}
            <span style={{ color: 'var(--danger)' }}>{invalidCount} invalid</span>
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle}>Row #</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Severity</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', color: 'var(--muted)' }}>
                    No data rows found in this file.
                  </td>
                </tr>
              )}
              {previewRows.map((r) => (
                <tr key={r.rowNumber} style={{ borderBottom: '1px solid #eee', background: r.valid ? undefined : '#fde2e1' }}>
                  <td style={tdStyle}>{r.rowNumber}</td>
                  <td style={tdStyle}>{r.data.title || <em>(blank)</em>}</td>
                  <td style={tdStyle}>{r.data.severity ? <SeverityBadge severity={r.data.severity} /> : ''}</td>
                  <td style={tdStyle}>{r.data.status || 'draft'}</td>
                  <td style={{ ...tdStyle, color: r.valid ? '#1a7f37' : '#a01c1c' }}>
                    {r.valid ? 'Valid' : r.errors.join('; ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={handleCommitImport} disabled={validCount === 0 || phase === 'importing'}>
              {phase === 'importing' ? 'Importing...' : `Import ${validCount} valid row${validCount === 1 ? '' : 's'}`}
            </button>
            <button className="btn-secondary" onClick={handleReset} disabled={phase === 'importing'}>
              Choose a different file
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <div>
          <p style={{ color: 'var(--success)' }}>
            Imported {result.imported} test case{result.imported === 1 ? '' : 's'}.
          </p>
          {result.skipped.length > 0 && (
            <div>
              <p style={{ color: 'var(--warning)' }}>{result.skipped.length} row(s) were skipped:</p>
              <ul>
                {result.skipped.map((s) => (
                  <li key={s.index}>
                    Row {s.index + 1}: {s.errors.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/test-cases">Go to test cases</Link>
            <button className="btn-secondary" onClick={handleReset}>
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem' };
const tdStyle = { padding: '0.5rem' };

export default ImportTestCasesPage;
