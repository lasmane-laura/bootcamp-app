import { useEffect, useState } from 'react';
import { listFlakyTests } from '../api/flaky-tests';
import FlakyBadge from '../components/FlakyBadge';
import RunHistoryDots from '../components/RunHistoryDots';
import Select from '../components/Select';
import SearchInput from '../components/SearchInput';
import InfoTooltip from '../components/InfoTooltip';
import FlakyLeaderboard from '../components/FlakyLeaderboard';

const PAGE_SIZE = 20;

const FLAKY_EXPLANATION =
  'A test case is flagged Flaky once its results have flipped between pass and fail at least 2 times across its run history (skipped runs are ignored when counting flips). Otherwise it\'s Stable.';

function FlakyTestTrackerPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('transitions');
  const [sortDir, setSortDir] = useState('desc');
  const [flakyFilter, setFlakyFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(true);
  const [leadersError, setLeadersError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listFlakyTests({ page: 1, pageSize: 10, sortBy: 'transitions', sortDir: 'desc', flaky: 'flaky' })
      .then((data) => {
        if (!cancelled) setLeaders(data.items);
      })
      .catch((err) => {
        if (!cancelled) setLeadersError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLeadersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [flakyFilter, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listFlakyTests({ page, pageSize: PAGE_SIZE, sortBy, sortDir, flaky: flakyFilter, search })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, sortBy, sortDir, flakyFilter, search]);

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  function SortArrow({ column }) {
    const active = sortBy === column;
    const symbol = active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅';
    return (
      <span aria-hidden="true" style={{ marginLeft: '0.35rem', color: active ? 'var(--link)' : 'var(--muted)' }}>
        {symbol}
      </span>
    );
  }

  function sortAriaValue(column) {
    if (sortBy !== column) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
        Flaky test tracker
        <InfoTooltip label="What counts as a flaky test">{FLAKY_EXPLANATION}</InfoTooltip>
      </h1>

      <FlakyLeaderboard items={leaders} loading={leadersLoading} error={leadersError} />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SearchInput
          aria-label="Search by title"
          placeholder="Search by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          wrapStyle={{ flex: 1 }}
        />
        <Select aria-label="Filter by flakiness" value={flakyFilter} onChange={(e) => setFlakyFilter(e.target.value)}>
          <option value="">All</option>
          <option value="flaky">Flaky</option>
          <option value="stable">Stable</option>
        </Select>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th aria-sort={sortAriaValue('title')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('title')}>
                    Test Case
                    <SortArrow column="title" />
                  </button>
                </th>
                <th aria-sort={sortAriaValue('totalRuns')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('totalRuns')}>
                    Runs
                    <SortArrow column="totalRuns" />
                  </button>
                </th>
                <th aria-sort={sortAriaValue('passRate')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('passRate')}>
                    Pass Rate
                    <SortArrow column="passRate" />
                  </button>
                </th>
                <th aria-sort={sortAriaValue('transitions')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('transitions')}>
                    Transitions
                    <SortArrow column="transitions" />
                  </button>
                </th>
                <th aria-sort={sortAriaValue('isFlaky')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('isFlaky')}>
                    Status
                    <SortArrow column="isFlaky" />
                  </button>
                </th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '1rem', color: 'var(--muted)' }}>
                    No test cases with recorded runs found.
                  </td>
                </tr>
              )}
              {items.map((tc) => (
                <tr key={tc.testCaseId}>
                  <td>{tc.title}</td>
                  <td>{tc.totalRuns}</td>
                  <td>{tc.passRate === null ? '—' : `${tc.passRate}%`}</td>
                  <td>{tc.transitions}</td>
                  <td>
                    <FlakyBadge isFlaky={tc.isFlaky} />
                  </td>
                  <td>
                    <RunHistoryDots history={tc.history} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <span>
              Page {page} of {totalPages} ({total} total)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const sortButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  fontWeight: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
};

export default FlakyTestTrackerPage;
