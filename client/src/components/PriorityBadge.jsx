const COLORS = {
  Urgent: { bg: '#fde2e1', fg: '#a01c1c' },
  High: { bg: '#fde8cc', fg: '#a15c00' },
  Medium: { bg: '#fff6cc', fg: '#8a7000' },
  Low: { bg: '#e6e6e6', fg: '#555555' },
};

function PriorityBadge({ priority }) {
  const colors = COLORS[priority] || COLORS.Medium;
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
      {priority}
    </span>
  );
}

export default PriorityBadge;
