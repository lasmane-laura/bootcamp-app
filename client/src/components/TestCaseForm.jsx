import { useState } from 'react';
import Dialog from './Dialog';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

function TestCaseForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [preconditions, setPreconditions] = useState(initial?.preconditions || '');
  const [stepsText, setStepsText] = useState(initial?.steps?.join('\n') || '');
  const [expectedResult, setExpectedResult] = useState(initial?.expectedResult || '');
  const [severity, setSeverity] = useState(initial?.severity || 'Major');
  const [status, setStatus] = useState(initial?.status || 'draft');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title.trim() || steps.length === 0 || !expectedResult.trim()) {
      setError('Title, steps, and expected result are required.');
      return;
    }

    onSubmit({
      title: title.trim(),
      preconditions: preconditions.trim() || null,
      steps,
      expectedResult: expectedResult.trim(),
      severity,
      status,
    });
  }

  return (
    <Dialog onClose={onCancel} style={{ background: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>{initial ? 'Edit test case' : 'New test case'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label>Preconditions</label>
          <textarea rows={2} value={preconditions} onChange={(e) => setPreconditions(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label>Steps * (one per line)</label>
          <textarea rows={4} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label>Expected result *</label>
          <textarea rows={2} value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label>Severity *</label>
          <select style={selectStyle} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label>Status</label>
          <select style={selectStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: '#a01c1c' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </Dialog>
  );
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  marginBottom: '0.75rem',
};

const selectStyle = {
  padding: '0.6rem 0.75rem',
  fontSize: '1.05rem',
  height: '2.75rem',
};

export default TestCaseForm;
