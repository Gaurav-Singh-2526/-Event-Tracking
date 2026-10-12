import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Sessions from './pages/Sessions.jsx';
import SessionDetails from './pages/SessionDetails.jsx';
import Heatmap from './pages/Heatmap.jsx';
import Analytics from './pages/Analytics.jsx';

/**
 * TrackerIntegration: fires page_view events on every route change.
 * Lives inside BrowserRouter so it can access useLocation().
 */
function TrackerIntegration() {
  const location = useLocation();
  const lastTracked = useRef(null);

  useEffect(() => {
    // Deduplicate: React StrictMode mounts twice, useRef prevents double tracking
    const key = location.pathname + location.search;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    // Use the tracker SDK if available (loaded via public/tracker.js)
    if (window.__tracker) {
      window.__tracker.trackPageView();
    }
  }, [location]);

  return null;
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/:sessionId" element={<SessionDetails />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
      <TrackerIntegration />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
