import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSuite, updateSuite, reorderSuiteCases, addCaseToSuite, removeCaseFromSuite } from '../api/suites';
import { listTestCases } from '../api/test-cases';
import { createRun } from '../api/test-runs';
import SeverityBadge from '../components/SeverityBadge';
import SuiteForm from '../components/SuiteForm';

function TestSuiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [cases, setCases] = useState([]);
  const [allTestCases, setAllTestCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [editingSuite, setEditingSuite] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    getSuite(id)
      .then((data) => {
        setSuite(data);
        setCases(data.cases);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    listTestCases({ pageSize: 500 }).then((data) => setAllTestCases(data.items));
  }, [id]);

  function handlePointerDown(startCases, caseId) {
    setDraggingId(caseId);
    let currentOrder = startCases;

    function handlePointerMove(e) {
      const rowEls = Array.from(document.querySelectorAll('[data-case-row]'));
      const overEl = rowEls.find((el) => {
        const rect = el.getBoundingClientRect();
        return e.clientY >= rect.top && e.clientY <= rect.bottom;
      });
      if (!overEl) return;

      const overId = Number(overEl.dataset.caseRow);
      if (overId === caseId) return;

      const ids = currentOrder.map((c) => c.id);
      const fromIndex = ids.indexOf(caseId);
      const toIndex = ids.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      const reordered = [...currentOrder];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      currentOrder = reordered;
      setCases(reordered);
    }

    async function handlePointerUp() {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      setDraggingId(null);
      try {
        await reorderSuiteCases(id, currentOrder.map((c) => c.id));
      } catch (err) {
        setError(err.message);
        load();
      }
    }

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
  }

  async function handleKeyReorder(caseId, direction) {
    const ids = cases.map((c) => c.id);
    const index = ids.indexOf(caseId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= cases.length) return;

    const reordered = [...cases];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setCases(reordered);

    try {
      await reorderSuiteCases(id, reordered.map((c) => c.id));
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function handleNewRun() {
    try {
      const run = await createRun(suite.id);
      navigate(`/test-runs/${run.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateSuite(payload) {
    const data = await updateSuite(id, payload);
    setSuite((prev) => ({ ...prev, ...data }));
    setEditingSuite(false);
  }

  async function handleAddCase() {
    if (!selectedCaseId) return;
    try {
      const data = await addCaseToSuite(id, Number(selectedCaseId));
      setCases(data.cases);
      setSelectedCaseId('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveCase(caseId) {
    if (!window.confirm('Remove this case from the suite?')) return;
    try {
      const data = await removeCaseFromSuite(id, caseId);
      setCases(data.cases);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (error && !suite) return <div style={{ padding: '2rem', color: '#a01c1c' }}>{error}</div>;
  if (!suite) return null;

  const availableCases = allTestCases.filter((tc) => !cases.some((c) => c.id === tc.id));

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <p>
        <Link to="/test-suites">← Back to test suites</Link>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>{suite.name}</h1>
          <p style={{ color: '#555', marginTop: 0 }}>
            Feature: <strong>{suite.feature}</strong> &middot; Status: <strong>{suite.status}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={handleNewRun}>+ New run</button>
          <button onClick={() => setEditingSuite(true)}>Edit suite</button>
        </div>
      </div>

      {error && <p style={{ color: '#a01c1c' }}>{error}</p>}

      <h2>Cases ({cases.length})</h2>
      {cases.length === 0 && <p style={{ color: '#777' }}>No cases in this suite yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cases.map((c) => (
          <li
            key={c.id}
            data-case-row={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              marginBottom: '0.4rem',
              border: '1px solid #eee',
              borderRadius: '6px',
              background: draggingId === c.id ? '#f5f5f5' : '#fff',
              userSelect: draggingId !== null ? 'none' : 'auto',
            }}
          >
            <button
              type="button"
              onMouseDown={() => handlePointerDown(cases, c.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  handleKeyReorder(c.id, -1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  handleKeyReorder(c.id, 1);
                }
              }}
              aria-label={`Reorder "${c.title}". Use the up and down arrow keys to move it.`}
              title="Drag to reorder, or focus and use arrow keys"
              style={{
                color: '#aaa',
                cursor: 'grab',
                fontSize: '1.1rem',
                lineHeight: 1,
                border: 'none',
                background: 'none',
                padding: '0.25rem',
              }}
            >
              ⠿
            </button>
            <span style={{ flex: 1 }}>{c.title}</span>
            <SeverityBadge severity={c.severity} />
            <span style={{ color: '#555', minWidth: '70px' }}>{c.status}</span>
            <button onClick={() => handleRemoveCase(c.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)} style={{ flex: 1, padding: '0.4rem' }}>
          <option value="">Select a test case to add...</option>
          {availableCases.map((tc) => (
            <option key={tc.id} value={tc.id}>
              {tc.title}
            </option>
          ))}
        </select>
        <button onClick={handleAddCase} disabled={!selectedCaseId}>
          + Add case
        </button>
      </div>

      {editingSuite && <SuiteForm initial={suite} onSubmit={handleUpdateSuite} onCancel={() => setEditingSuite(false)} />}
    </div>
  );
}

export default TestSuiteDetailPage;
