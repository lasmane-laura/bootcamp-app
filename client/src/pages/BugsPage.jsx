import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBugs, createBug } from '../api/bugs';
import SeverityBadge from '../components/SeverityBadge';
import PriorityBadge from '../components/PriorityBadge';
import BugForm from '../components/BugForm';
import { useSettings } from '../context/SettingsContext';
import Select from '../components/Select';
import SearchInput from '../components/SearchInput';

const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];

function BugsPage() {
  const { settings } = useSettings();
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listBugs({ status: statusFilter, severity: severityFilter, search, sortBy, sortDir })
      .then((data) => {
        if (!cancelled) setItems(data.items);
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
  }, [statusFilter, severityFilter, search, sortBy, sortDir, reloadKey]);

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

  async function handleCreate(payload) {
    await createBug(payload);
    setFormOpen(false);
    setReloadKey((k) => k + 1);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Bugs</h1>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          + New bug
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SearchInput
          aria-label="Search title or description"
          placeholder="Search title or description..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          wrapStyle={{ flex: 1 }}
        />
        <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by severity" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th aria-sort={sortAriaValue('title')}>
                <button type="button" style={sortButtonStyle} onClick={() => toggleSort('title')}>
                  Title
                  <SortArrow column="title" />
                </button>
              </th>
              <th aria-sort={sortAriaValue('severity')}>
                <button type="button" style={sortButtonStyle} onClick={() => toggleSort('severity')}>
                  Severity
                  <SortArrow column="severity" />
                </button>
              </th>
              <th aria-sort={sortAriaValue('priority')}>
                <button type="button" style={sortButtonStyle} onClick={() => toggleSort('priority')}>
                  Priority
                  <SortArrow column="priority" />
                </button>
              </th>
              <th aria-sort={sortAriaValue('status')}>
                <button type="button" style={sortButtonStyle} onClick={() => toggleSort('status')}>
                  Status
                  <SortArrow column="status" />
                </button>
              </th>
              <th aria-sort={sortAriaValue('updatedAt')}>
                <button type="button" style={sortButtonStyle} onClick={() => toggleSort('updatedAt')}>
                  Updated
                  <SortArrow column="updatedAt" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: 'var(--muted)' }}>
                  No bugs found.
                </td>
              </tr>
            )}
            {items.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link to={`/bugs/${b.id}`}>{b.title}</Link>
                </td>
                <td>
                  <SeverityBadge severity={b.severity} />
                </td>
                <td>
                  <PriorityBadge priority={b.priority} />
                </td>
                <td>{b.status}</td>
                <td>{new Date(b.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <BugForm
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
          defaultSeverity={settings?.defaultSeverityForNewBugs}
        />
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

export default BugsPage;
