// Single source of truth for keyboard shortcuts. Both the global key handler
// (KeyboardShortcuts.jsx) and the help modal (HelpModal.jsx) read this same
// list, so the two can never drift out of sync.
export const SHORTCUTS = [
  { id: 'quick-search', description: 'Open quick search', keys: [{ key: 'k', mod: true }] },
  { id: 'go-bugs', description: 'Go to Bugs', keys: [{ key: 'g' }, { key: 'b' }] },
  { id: 'go-test-cases', description: 'Go to Test cases', keys: [{ key: 'g' }, { key: 't' }] },
  { id: 'go-runs', description: 'Go to Test runs', keys: [{ key: 'g' }, { key: 'r' }] },
  { id: 'go-dashboard', description: 'Go to Dashboard', keys: [{ key: 'g' }, { key: 'd' }] },
  { id: 'help', description: 'Show this help', keys: [{ key: '?' }] },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform || '');

export function formatKeyStep(step) {
  const parts = [];
  if (step.mod) parts.push(isMac ? '⌘' : 'Ctrl');
  parts.push(step.key.length === 1 ? step.key.toUpperCase() : step.key);
  return parts.join('+');
}

export function formatShortcut(shortcut) {
  return shortcut.keys.map(formatKeyStep);
}
