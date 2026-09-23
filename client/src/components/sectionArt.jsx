export function DashboardArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="55" width="14" height="30" rx="3" fill="currentColor" fillOpacity="0.25" />
      <rect x="43" y="35" width="14" height="50" rx="3" fill="currentColor" fillOpacity="0.4" />
      <rect x="66" y="45" width="14" height="40" rx="3" fill="currentColor" fillOpacity="0.55" />
      <polyline points="27,50 50,30 73,40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="50" r="3" fill="currentColor" />
      <circle cx="50" cy="30" r="3" fill="currentColor" />
      <circle cx="73" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}

export function TestCasesArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <rect x="25" y="15" width="50" height="70" rx="6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
      <rect x="40" y="10" width="20" height="12" rx="3" fill="currentColor" fillOpacity="0.5" />
      <line x1="35" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="35" y1="57" x2="65" y2="57" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M35 69 L42 76 L55 63" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SuitesArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <rect x="22" y="55" width="56" height="20" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
      <rect x="26" y="40" width="48" height="20" rx="4" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="2" />
      <rect x="30" y="25" width="40" height="20" rx="4" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function RunsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="34" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
      <path d="M50 16 A34 34 0 0 1 82 46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="42,36 42,64 66,50" fill="currentColor" />
    </svg>
  );
}

export function FlakyTestsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="34" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
      <polyline
        points="24,55 37,55 43,38 51,68 59,42 65,55 76,55"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BugsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <line x1="50" y1="34" x2="50" y2="76" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="30" y1="42" x2="18" y2="34" />
        <line x1="30" y1="55" x2="16" y2="55" />
        <line x1="30" y1="68" x2="18" y2="76" />
        <line x1="70" y1="42" x2="82" y2="34" />
        <line x1="70" y1="55" x2="84" y2="55" />
        <line x1="70" y1="68" x2="82" y2="76" />
        <line x1="44" y1="18" x2="38" y2="10" />
        <line x1="56" y1="18" x2="62" y2="10" />
      </g>
      <ellipse cx="50" cy="55" rx="20" ry="26" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="26" r="9" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ReportsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <path d="M28 12 H60 L72 24 V88 H28 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M60 12 V24 H72" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="36" y1="70" x2="36" y2="78" />
        <line x1="46" y1="62" x2="46" y2="78" />
        <line x1="56" y1="55" x2="56" y2="78" />
        <line x1="66" y1="48" x2="66" y2="78" />
      </g>
    </svg>
  );
}

export function SettingsArt() {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <g fill="currentColor">
        <rect x="45" y="18" width="10" height="14" rx="2" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(45 50 50)" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(90 50 50)" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(135 50 50)" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(180 50 50)" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(225 50 50)" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(270 50 50)" />
        <rect x="45" y="18" width="10" height="14" rx="2" transform="rotate(315 50 50)" />
      </g>
      <circle cx="50" cy="50" r="20" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
