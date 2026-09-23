import { useState } from 'react';
import Dialog from './Dialog';
import Select from './Select';

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

function SuiteForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [feature, setFeature] = useState(initial?.feature || '');
  const [status, setStatus] = useState(initial?.status || 'draft');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || !feature.trim()) {
      setError('Name and feature are required.');
      return;
    }

    onSubmit({ name: name.trim(), feature: feature.trim(), status });
  }

  return (
    <Dialog onClose={onCancel}>
      <h2 style={{ marginTop: 0 }}>{initial ? 'Edit suite' : 'New suite'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="suite-name">Name *</label>
          <input id="suite-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="suite-feature">Feature *</label>
          <input id="suite-feature" placeholder="e.g. login" value={feature} onChange={(e) => setFeature(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="suite-status">Status</label>
          <Select id="suite-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save
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

export default SuiteForm;
