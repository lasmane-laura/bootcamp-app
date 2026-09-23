import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import SectionCard from '../components/SectionCard';
import {
  DashboardArt,
  TestCasesArt,
  SuitesArt,
  RunsArt,
  FlakyTestsArt,
  BugsArt,
  ReportsArt,
  SettingsArt,
} from '../components/sectionArt';

const SECTIONS = [
  { to: '/dashboard', title: 'Dashboard', art: DashboardArt },
  { to: '/test-cases', title: 'Test Cases', art: TestCasesArt },
  { to: '/test-suites', title: 'Suites', art: SuitesArt },
  { to: '/test-runs', title: 'Runs', art: RunsArt },
  { to: '/flaky-tests', title: 'Flaky Tests', art: FlakyTestsArt },
  { to: '/bugs', title: 'Bugs', art: BugsArt },
  { to: '/reports', title: 'Reports', art: ReportsArt },
  { to: '/settings', title: 'Settings', art: SettingsArt },
];

function formatRigaDateTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Riga',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function HomePage() {
  const [status, setStatus] = useState('checking');
  const now = useNow();

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body) => setStatus(body.data.status === 'ok' ? 'ok' : 'down'))
      .catch(() => setStatus('down'));
  }, []);

  const statusClass = status === 'ok' ? 'status-ok' : status === 'checking' ? 'status-pending' : 'status-down';
  const statusLabel = status === 'ok' ? 'Server online' : status === 'checking' ? 'Checking server...' : 'Server unreachable';

  return (
    <div>
      <div className="hello-header">
        <div className="hello-greeting">
          <Logo size={28} />
          <div>
            <h1>Hello, QA!</h1>
            <p className="hello-datetime">{formatRigaDateTime(now)} (Riga time)</p>
          </div>
        </div>
        <div className="hello-meta">
          <span className={`status-pill ${statusClass}`}>
            <span className="status-dot" aria-hidden="true" />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="section-grid">
        {SECTIONS.map((s) => (
          <SectionCard key={s.to} to={s.to} title={s.title} art={s.art} />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
