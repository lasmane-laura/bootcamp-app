import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTestCases, createTestCase, updateTestCase, deleteTestCase, testCasesExportUrl } from '../api/test-cases';
import SeverityBadge from '../components/SeverityBadge';
import TestCaseForm from '../components/TestCaseForm';
import TestCaseViewDialog from '../components/TestCaseViewDialog';
import Select from '../components/Select';
import SearchInput from '../components/SearchInput';

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

  useEffect(() => {
    if (openMenuId === null) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpenMenuId(null);
    }
    function handleClickOutside(e) {
      if (!e.target.closest('[data-row-menu]')) setOpenMenuId(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Test cases</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/test-cases/import">
            <button type="button" className="btn-secondary">
              Import CSV
            </button>
          </Link>
          <a
            href={testCasesExportUrl({ sortBy, sortDir, status: statusFilter, severity: severityFilter, search })}
            download={`test-cases-${new Date().toISOString().slice(0, 10)}.csv`}
          >
            <button type="button" className="btn-secondary">
              Download CSV
            </button>
          </a>
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            + New test case
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SearchInput
          aria-label="Search by title"
          placeholder="Search by title..."
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
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle} aria-sort={sortAriaValue('title')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('title')}>
                    Title
                    <SortArrow column="title" />
                  </button>
                </th>
                <th style={thStyle} aria-sort={sortAriaValue('severity')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('severity')}>
                    Severity
                    <SortArrow column="severity" />
                  </button>
                </th>
                <th style={thStyle} aria-sort={sortAriaValue('status')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('status')}>
                    Status
                    <SortArrow column="status" />
                  </button>
                </th>
                <th style={thStyle} aria-sort={sortAriaValue('updatedAt')}>
                  <button type="button" style={sortButtonStyle} onClick={() => toggleSort('updatedAt')}>
                    Updated
                    <SortArrow column="updatedAt" />
                  </button>
                </th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', color: 'var(--muted)' }}>
                    No test cases found.
                  </td>
                </tr>
              )}
              {items.map((tc) => (
                <tr key={tc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>
                    <button type="button" style={rowTitleButtonStyle} onClick={() => setViewing(tc)}>
                      {tc.title}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <SeverityBadge severity={tc.severity} />
                  </td>
                  <td style={tdStyle}>{tc.status}</td>
                  <td style={tdStyle}>{new Date(tc.updatedAt).toLocaleString()}</td>
                  <td style={{ ...tdStyle, position: 'relative', textAlign: 'right' }} data-row-menu>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.5rem 0.75rem' }}
                      aria-label={`Actions for "${tc.title}"`}
                      aria-haspopup="true"
                      aria-expanded={openMenuId === tc.id}
                      onClick={() => setOpenMenuId(openMenuId === tc.id ? null : tc.id)}
                    >
                      ⋮
                    </button>
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

const rowTitleButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  color: 'var(--link)',
  textDecoration: 'underline',
  cursor: 'pointer',
  textAlign: 'left',
};

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

const menuStyle = {
  position: 'absolute',
  right: 0,
  top: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
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
