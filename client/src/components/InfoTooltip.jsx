import { useState } from 'react';

function InfoTooltip({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={buttonStyle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div role="tooltip" style={tooltipStyle}>
          {children}
        </div>
      )}
    </span>
  );
}

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '1px solid var(--muted)',
  background: 'none',
  color: 'var(--muted)',
  cursor: 'help',
  padding: 0,
};

const tooltipStyle = {
  position: 'absolute',
  top: '130%',
  left: 0,
  zIndex: 20,
  width: '320px',
  maxWidth: '80vw',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.85rem',
  fontWeight: 400,
  lineHeight: 1.4,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

export default InfoTooltip;
