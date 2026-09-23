const COLORS = {
  Flaky: { bg: '#fde2e1', fg: '#a01c1c' },
  Stable: { bg: '#d9f2e3', fg: '#1a7f37' },
};

function FlakyBadge({ isFlaky }) {
  const label = isFlaky ? 'Flaky' : 'Stable';
  const colors = COLORS[label];
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
      {label}
    </span>
  );
}

export default FlakyBadge;
