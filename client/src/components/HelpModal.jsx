import Dialog from './Dialog';
import { SHORTCUTS, formatShortcut } from '../shortcuts';

function HelpModal({ onClose }) {
  return (
    <Dialog onClose={onClose} style={{ width: '420px' }}>
      <h2 style={{ marginTop: 0 }}>Keyboard shortcuts</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {SHORTCUTS.map((shortcut) => (
            <tr key={shortcut.id} style={{ borderBottom: '1px solid var(--border, #eee)' }}>
              <td style={{ padding: '0.5rem 0.75rem 0.5rem 0', color: 'var(--text)' }}>{shortcut.description}</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {formatShortcut(shortcut).map((key, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ color: 'var(--muted)', margin: '0 0.35rem' }}>then</span>}
                    <kbd style={kbdStyle}>{key}</kbd>
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 0 }}>
        Shortcuts don't fire while typing in a field, or while a dialog is open.
      </p>
    </Dialog>
  );
}

const kbdStyle = {
  display: 'inline-block',
  padding: '0.15rem 0.45rem',
  border: '1px solid var(--border, #ccc)',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  background: 'var(--input-bg, #f5f5f5)',
};

export default HelpModal;
