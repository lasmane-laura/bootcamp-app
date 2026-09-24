import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSuites, createSuite, updateSuite, deleteSuite, getSuite } from '../api/suites';
import SuiteForm from '../components/SuiteForm';
import Select from '../components/Select';

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
    let message = 'Delete this suite?';
    try {
      const detail = await getSuite(id);
      const atRiskTitles = detail.cases.filter((c) => c.atRiskIfDeleted).map((c) => c.title);
      if (atRiskTitles.length > 0) {
        message =
          `Delete this suite? This also permanently deletes its test runs, which will corrupt the ` +
          `flaky-test history for ${atRiskTitles.length} test case(s) also used in other suites:\n` +
          atRiskTitles.map((t) => `- ${t}`).join('\n');
      }
    } catch {
      // If the pre-check fails, fall back to the generic confirmation rather than blocking deletion.
    }

    if (!window.confirm(message)) return;
    await deleteSuite(id);
    setReloadKey((k) => k + 1);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Test suites</h1>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          + New suite
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          wrapStyle={{ width: '200px' }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
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
              <th>Name</th>
              <th>Feature</th>
              <th>Status</th>
              <th>Cases</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', color: 'var(--muted)' }}>
                  No suites found.
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/test-suites/${s.id}`}>{s.name}</Link>
                </td>
                <td>{s.feature}</td>
                <td>{s.status}</td>
                <td>{s.caseCount}</td>
                <td>{new Date(s.updatedAt).toLocaleString()}</td>
                <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setEditing(s)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(s.id)}>
                    Delete
                  </button>
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

export default TestSuitesPage;
