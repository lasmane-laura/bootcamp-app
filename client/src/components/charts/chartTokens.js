export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];

// Reuses the app's own theme tokens (index.css) so SVG fill/stroke and inline
// styles built from these resolve against the current theme automatically —
// no re-render needed when the user switches light/dark.
export const INK = {
  primary: 'var(--text)',
  secondary: 'var(--text)',
  muted: 'var(--muted)',
  gridline: 'var(--border)',
  axis: 'var(--border)',
  surface: 'var(--input-bg)',
};

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
