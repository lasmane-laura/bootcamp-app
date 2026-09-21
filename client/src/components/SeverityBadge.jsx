const COLORS = {
  Critical: { bg: '#fde2e1', fg: '#a01c1c' },
  Major: { bg: '#fde8cc', fg: '#a15c00' },
  Minor: { bg: '#fff6cc', fg: '#8a7000' },
  Trivial: { bg: '#e6e6e6', fg: '#555555' },
};

function SeverityBadge({ severity }) {
  const colors = COLORS[severity] || COLORS.Trivial;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        background: colors.bg,
        color: colors.fg,
      }}
    >
      {severity}
    </span>
  );
}

export default SeverityBadge;
