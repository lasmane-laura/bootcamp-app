import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TestCasesPage from './pages/TestCasesPage';
import TestSuitesPage from './pages/TestSuitesPage';
import TestSuiteDetailPage from './pages/TestSuiteDetailPage';
import BugsPage from './pages/BugsPage';
import BugDetailPage from './pages/BugDetailPage';
import TestRunsPage from './pages/TestRunsPage';
import TestRunDetailPage from './pages/TestRunDetailPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';

function HomePage() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body) => setStatus(body.data.status))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Bootcamp App</h1>
      <p>Server status: {status}</p>
      <p>
        <Link to="/test-cases">Go to Test Cases</Link>
      </p>
      <p>
        <Link to="/test-suites">Go to Test Suites</Link>
      </p>
      <p>
        <Link to="/bugs">Go to Bugs</Link>
      </p>
      <p>
        <Link to="/test-runs">Go to Test Runs</Link>
      </p>
      <p>
        <Link to="/dashboard">Go to Dashboard</Link>
      </p>
      <p>
        <Link to="/reports">Go to Reports</Link>
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-suites" element={<TestSuitesPage />} />
        <Route path="/test-suites/:id" element={<TestSuiteDetailPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
        <Route path="/test-runs" element={<TestRunsPage />} />
        <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
