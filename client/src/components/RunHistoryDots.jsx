const RESULT_COLORS = {
  pending: '#777',
  passed: '#1a7f37',
  failed: '#a01c1c',
  skipped: '#8a7000',
};

function RunHistoryDots({ history }) {
  if (!history || history.length === 0) {
    return <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>No runs</span>;
  }

  return (
    <span
      role="group"
      aria-label="Run history"
      style={{ display: 'inline-flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}
    >
      {history.map((h) => {
        const label = `${new Date(h.date).toLocaleString()} — ${h.result}`;
        return (
          <span
            key={h.runId}
            role="img"
            aria-label={label}
            title={label}
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: RESULT_COLORS[h.result] || RESULT_COLORS.pending,
              flexShrink: 0,
            }}
          />
        );
      })}
    </span>
  );
}

export default RunHistoryDots;
