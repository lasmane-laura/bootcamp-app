import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from './Dialog';
import SearchInput from './SearchInput';
import { listTestCases } from '../api/test-cases';
import { listBugs } from '../api/bugs';
import { listSuites } from '../api/suites';

const GROUPS = [
  { key: 'testCases', label: 'Test cases', path: (item) => `/test-cases` },
  { key: 'bugs', label: 'Bugs', path: (item) => `/bugs/${item.id}` },
  { key: 'suites', label: 'Suites', path: (item) => `/test-suites/${item.id}` },
];

function QuickSearchModal({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ testCases: [], bugs: [], suites: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ testCases: [], bugs: [], suites: [] });
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      Promise.all([
        listTestCases({ search: trimmed, pageSize: 5 }).catch(() => ({ items: [] })),
        listBugs({ search: trimmed }).catch(() => ({ items: [] })),
        listSuites().catch(() => ({ items: [] })),
      ]).then(([testCasesRes, bugsRes, suitesRes]) => {
        if (cancelled) return;
        const needle = trimmed.toLowerCase();
        setResults({
          testCases: (testCasesRes.items || []).slice(0, 5),
          bugs: (bugsRes.items || []).slice(0, 5),
          suites: (suitesRes.items || suitesRes || [])
            .filter((s) => s.name.toLowerCase().includes(needle) || s.feature.toLowerCase().includes(needle))
            .slice(0, 5),
        });
        setActiveIndex(0);
        setLoading(false);
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const flat = GROUPS.flatMap((group) => (results[group.key] || []).map((item) => ({ group, item })));

  function goTo(entry) {
    navigate(entry.group.path(entry.item));
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[activeIndex]) goTo(flat[activeIndex]);
    }
  }

  let rowIndex = -1;

  return (
    <Dialog onClose={onClose} ariaLabel="Quick search" style={{ width: '560px', padding: 0 }}>
      <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
        <SearchInput
          ref={inputRef}
          aria-label="Search test cases, bugs, and suites"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search test cases, bugs, suites..."
        />
      </div>

      <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
        {!query.trim() && <p style={{ color: 'var(--muted)', padding: '0.5rem 0.75rem' }}>Type to search across everything.</p>}
        {query.trim() && loading && <p style={{ color: 'var(--muted)', padding: '0.5rem 0.75rem' }}>Searching...</p>}
        {query.trim() && !loading && flat.length === 0 && (
          <p style={{ color: 'var(--muted)', padding: '0.5rem 0.75rem' }}>No results for "{query.trim()}".</p>
        )}

        {GROUPS.map((group) => {
          const items = results[group.key] || [];
          if (items.length === 0) return null;
          return (
            <div key={group.key} style={{ marginBottom: '0.5rem' }}>
              <div style={groupLabelStyle}>{group.label}</div>
              {items.map((item) => {
                rowIndex += 1;
                const isActive = rowIndex === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo({ group, item })}
                    onMouseEnter={() => setActiveIndex(rowIndex)}
                    style={{ ...rowStyle, background: isActive ? 'color-mix(in srgb, var(--link) 18%, transparent)' : 'transparent' }}
                  >
                    {item.title || item.name}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}

const groupLabelStyle = {
  padding: '0.4rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--muted)',
};

const rowStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  color: 'var(--text)',
};

export default QuickSearchModal;
