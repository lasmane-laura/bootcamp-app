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
    <span style={{ display: 'inline-flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
      {history.map((h) => (
        <span
          key={h.runId}
          title={`${new Date(h.date).toLocaleString()} — ${h.result}`}
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: RESULT_COLORS[h.result] || RESULT_COLORS.pending,
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}

export default RunHistoryDots;
