import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSuites, createSuite, updateSuite, deleteSuite } from '../api/suites';
import SuiteForm from '../components/SuiteForm';

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

function TestSuitesPage() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listSuites({ status: statusFilter })
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
  }, [statusFilter, reloadKey]);

  async function handleCreate(payload) {
    await createSuite(payload);
    setFormOpen(false);
    setReloadKey((k) => k + 1);
  }

  async function handleUpdate(payload) {
    await updateSuite(editing.id, payload);
    setEditing(null);
    setReloadKey((k) => k + 1);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this suite?')) return;
    await deleteSuite(id);
    setReloadKey((k) => k + 1);
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Test suites</h1>
        <button onClick={() => setFormOpen(true)}>+ New suite</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
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
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Feature</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Cases</th>
              <th style={thStyle}>Updated</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', color: '#777' }}>
                  No suites found.
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <Link to={`/test-suites/${s.id}`}>{s.name}</Link>
                </td>
                <td style={tdStyle}>{s.feature}</td>
                <td style={tdStyle}>{s.status}</td>
                <td style={tdStyle}>{s.caseCount}</td>
                <td style={tdStyle}>{new Date(s.updatedAt).toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditing(s)}>Edit</button>
                  <button onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && <SuiteForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />}
      {editing && <SuiteForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
    </div>
  );
}

const thStyle = { padding: '0.5rem' };
const tdStyle = { padding: '0.5rem' };

export default TestSuitesPage;
