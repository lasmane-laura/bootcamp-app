export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];

export const INK = {
  primary: '#222',
  secondary: '#555',
  muted: '#777',
  gridline: '#eee',
  axis: '#ddd',
  surface: '#fff',
};

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
