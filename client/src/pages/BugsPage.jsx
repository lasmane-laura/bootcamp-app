import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBugs, createBug } from '../api/bugs';
import SeverityBadge from '../components/SeverityBadge';
import PriorityBadge from '../components/PriorityBadge';
import BugForm from '../components/BugForm';

const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];

function BugsPage() {
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
    return <span style={{ marginLeft: '0.35rem', color: active ? '#2563eb' : '#aaa' }}>{symbol}</span>;
  }

  async function handleCreate(payload) {
    await createBug(payload);
    setFormOpen(false);
    setReloadKey((k) => k + 1);
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Bugs</h1>
        <button onClick={() => setFormOpen(true)}>+ New bug</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          placeholder="Search title or description..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1, padding: '0.4rem' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: '#a01c1c' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('title')}>
                Title
                <SortArrow column="title" />
              </th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('severity')}>
                Severity
                <SortArrow column="severity" />
              </th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('priority')}>
                Priority
                <SortArrow column="priority" />
              </th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('status')}>
                Status
                <SortArrow column="status" />
              </th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('updatedAt')}>
                Updated
                <SortArrow column="updatedAt" />
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: '#777' }}>
                  No bugs found.
                </td>
              </tr>
            )}
            {items.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <Link to={`/bugs/${b.id}`}>{b.title}</Link>
                </td>
                <td style={tdStyle}>
                  <SeverityBadge severity={b.severity} />
                </td>
                <td style={tdStyle}>
                  <PriorityBadge priority={b.priority} />
                </td>
                <td style={tdStyle}>{b.status}</td>
                <td style={tdStyle}>{new Date(b.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && <BugForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />}
    </div>
  );
}

const thStyle = { padding: '0.5rem' };
const tdStyle = { padding: '0.5rem' };

export default BugsPage;
