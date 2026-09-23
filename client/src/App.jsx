import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TestCasesPage from './pages/TestCasesPage';
import ImportTestCasesPage from './pages/ImportTestCasesPage';
import TestSuitesPage from './pages/TestSuitesPage';
import TestSuiteDetailPage from './pages/TestSuiteDetailPage';
import BugsPage from './pages/BugsPage';
import BugDetailPage from './pages/BugDetailPage';
import TestRunsPage from './pages/TestRunsPage';
import TestRunDetailPage from './pages/TestRunDetailPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import Layout from './components/Layout';

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <KeyboardShortcuts>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/test-cases" element={<TestCasesPage />} />
              <Route path="/test-cases/import" element={<ImportTestCasesPage />} />
              <Route path="/test-suites" element={<TestSuitesPage />} />
              <Route path="/test-suites/:id" element={<TestSuiteDetailPage />} />
              <Route path="/bugs" element={<BugsPage />} />
              <Route path="/bugs/:id" element={<BugDetailPage />} />
              <Route path="/test-runs" element={<TestRunsPage />} />
              <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </KeyboardShortcuts>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
