function AttachmentIcon({ kind }) {
  if (kind === 'video') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ color: 'var(--muted)', flexShrink: 0 }}>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 9.5 L15.5 12 L10 14.5 Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ color: 'var(--muted)', flexShrink: 0 }}>
      <path d="M6 3 H14 L18 7 V21 H6 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3 V7 H18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default AttachmentIcon;
