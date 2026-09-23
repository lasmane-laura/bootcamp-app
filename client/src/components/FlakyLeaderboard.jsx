import FlakyBadge from './FlakyBadge';

function FlakyLeaderboard({ items, loading, error }) {
  return (
    <div className="leaderboard">
      <h2 style={{ margin: '0 0 0.75rem' }}>Top 10 flakiest tests</h2>

      {loading && <p style={{ color: 'var(--muted)', margin: 0 }}>Loading...</p>}
      {error && <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p style={{ color: 'var(--muted)', margin: 0 }}>No flaky test cases yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ol className="leaderboard-list">
          {items.map((item, i) => (
            <li key={item.testCaseId} className="leaderboard-row">
              <span className="leaderboard-rank">{i + 1}</span>
              <span className="leaderboard-title">{item.title}</span>
              <span className="leaderboard-meta">
                {item.transitions} flip{item.transitions === 1 ? '' : 's'} · {item.passRate === null ? '—' : `${item.passRate}%`} pass ·{' '}
                {item.totalRuns} runs
              </span>
              <FlakyBadge isFlaky={item.isFlaky} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default FlakyLeaderboard;
