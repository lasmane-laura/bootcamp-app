import Dialog from './Dialog';
import SeverityBadge from './SeverityBadge';

function TestCaseViewDialog({ testCase, onClose, onEdit, onDelete }) {
  return (
    <Dialog onClose={onClose} style={{ position: 'relative' }}>
      <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
        ×
      </button>

      <h2 style={{ marginTop: 0, marginRight: '2rem' }}>{testCase.title}</h2>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <SeverityBadge severity={testCase.severity} />
        <span style={{ color: 'var(--muted)' }}>{testCase.status}</span>
      </div>

      {testCase.preconditions && (
        <div style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Preconditions</h3>
          <p style={{ margin: 0 }}>{testCase.preconditions}</p>
        </div>
      )}

      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Steps</h3>
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {testCase.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Expected result</h3>
        <p style={{ margin: 0 }}>{testCase.expectedResult}</p>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Updated {new Date(testCase.updatedAt).toLocaleString()}</p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => onEdit(testCase)}>
          Edit
        </button>
        <button className="btn-danger" onClick={() => onDelete(testCase.id)}>
          Delete
        </button>
      </div>
    </Dialog>
  );
}

const sectionStyle = { marginBottom: '1rem' };
const sectionHeadingStyle = { margin: '0 0 0.25rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--muted)' };

const closeButtonStyle = {
  position: 'absolute',
  top: '0.75rem',
  right: '0.75rem',
  border: 'none',
  background: 'none',
  fontSize: '1.5rem',
  lineHeight: 1,
  cursor: 'pointer',
  color: 'var(--muted)',
};

export default TestCaseViewDialog;
