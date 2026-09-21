import { useEffect, useState } from 'react';
import { listTestCases, createTestCase, updateTestCase, deleteTestCase } from '../api/test-cases';
import SeverityBadge from '../components/SeverityBadge';
import TestCaseForm from '../components/TestCaseForm';
import TestCaseViewDialog from '../components/TestCaseViewDialog';

const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PAGE_SIZE = 20;

function TestCasesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, severityFilter, search]);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listTestCases({ page, pageSize: PAGE_SIZE, sortBy, sortDir, status: statusFilter, severity: severityFilter, search })
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
  }, [page, sortBy, sortDir, statusFilter, severityFilter, search, reloadKey]);

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
    await createTestCase(payload);
    setFormOpen(false);
    refetch();
  }

  async function handleUpdate(payload) {
    await updateTestCase(editing.id, payload);
    setEditing(null);
    refetch();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this test case?')) return;
    await deleteTestCase(id);
    setOpenMenuId(null);
    setViewing(null);
    refetch();
  }

  function refetch() {
    setReloadKey((k) => k + 1);
  }

  function handleEditFromView(tc) {
    setViewing(null);
    setEditing(tc);
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Test cases</h1>
        <button onClick={() => setFormOpen(true)}>+ New test case</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          placeholder="Search by title..."
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
        <>
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
                <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('status')}>
                  Status
                  <SortArrow column="status" />
                </th>
                <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('updatedAt')}>
                  Updated
                  <SortArrow column="updatedAt" />
                </th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', color: '#777' }}>
                    No test cases found.
                  </td>
                </tr>
              )}
              {items.map((tc) => (
                <tr key={tc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ ...tdStyle, cursor: 'pointer' }} onClick={() => setViewing(tc)}>
                    {tc.title}
                  </td>
                  <td style={tdStyle}>
                    <SeverityBadge severity={tc.severity} />
                  </td>
                  <td style={tdStyle}>{tc.status}</td>
                  <td style={tdStyle}>{new Date(tc.updatedAt).toLocaleString()}</td>
                  <td style={{ ...tdStyle, position: 'relative', textAlign: 'right' }}>
                    <button onClick={() => setOpenMenuId(openMenuId === tc.id ? null : tc.id)}>⋮</button>
                    {openMenuId === tc.id && (
                      <div style={menuStyle}>
                        <button
                          style={menuItemStyle}
                          onClick={() => {
                            setEditing(tc);
                            setOpenMenuId(null);
                          }}
                        >
                          Edit
                        </button>
                        <button style={menuItemStyle} onClick={() => handleDelete(tc.id)}>
                          Delete
                        </button>
                      </div>
                    )}
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
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {formOpen && <TestCaseForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />}
      {editing && <TestCaseForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      {viewing && (
        <TestCaseViewDialog
          testCase={viewing}
          onClose={() => setViewing(null)}
          onEdit={handleEditFromView}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem' };
const tdStyle = { padding: '0.5rem' };

const menuStyle = {
  position: 'absolute',
  right: 0,
  top: '100%',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '4px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  minWidth: '100px',
};

const menuItemStyle = {
  padding: '0.5rem 0.75rem',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  cursor: 'pointer',
};

export default TestCasesPage;
