import { useState } from 'react';
import Dialog from './Dialog';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function BugForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [severity, setSeverity] = useState(initial?.severity || 'Major');
  const [priority, setPriority] = useState(initial?.priority || 'Medium');
  const [stepsText, setStepsText] = useState(initial?.steps?.join('\n') || '');
  const [expected, setExpected] = useState(initial?.expected || '');
  const [actual, setActual] = useState(initial?.actual || '');
  const [environment, setEnvironment] = useState(initial?.environment || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title.trim() || !description.trim() || steps.length === 0 || !expected.trim() || !actual.trim()) {
      setError('Title, description, steps, expected, and actual are required.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        severity,
        priority,
        steps,
        expected: expected.trim(),
        actual: actual.trim(),
        environment: environment.trim() || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onClose={onCancel} style={{ background: '#fff', width: '560px' }}>
      <h2 style={{ marginTop: 0 }}>{initial ? 'Edit bug' : 'New bug'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="bug-title">Title *</label>
          <input id="bug-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-description">Description *</label>
          <textarea id="bug-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-steps">Steps to reproduce * (one per line)</label>
          <textarea id="bug-steps" rows={4} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-expected">Expected *</label>
          <textarea id="bug-expected" rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-actual">Actual *</label>
          <textarea id="bug-actual" rows={2} value={actual} onChange={(e) => setActual(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-environment">Environment</label>
          <input
            id="bug-environment"
            placeholder="e.g. Chrome 128, macOS"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label htmlFor="bug-severity">Severity *</label>
            <select id="bug-severity" style={selectStyle} value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...fieldStyle, flex: 1 }}>
            <label htmlFor="bug-priority">Priority</label>
            <select id="bug-priority" style={selectStyle} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p style={{ color: '#a01c1c' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
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
  width: '100%',
};

export default BugForm;
