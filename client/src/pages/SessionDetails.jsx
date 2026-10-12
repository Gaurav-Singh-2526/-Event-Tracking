import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import EventTimeline from '../components/EventTimeline.jsx';
import { getSessionEvents } from '../services/api.js';

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

function SessionSummaryCard({ session, sessionId, loading }) {
  if (loading) {
    return (
      <div className="card session-summary">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="card session-summary">
      <div className="session-summary-header">
        <h2 className="card-title">Session Summary</h2>
        <Link to="/sessions" className="btn btn-outline btn-sm">
          ← All Sessions
        </Link>
      </div>

      <div className="session-id-block">
        <span className="label">Session ID</span>
        <code className="mono session-id-value">{sessionId}</code>
      </div>

      {session ? (
        <div className="session-meta-grid">
          <div className="session-meta-item">
            <span className="label">Started</span>
            <span className="value">{fmtDate(session.started_at)}</span>
          </div>
          <div className="session-meta-item">
            <span className="label">Last Activity</span>
            <span className="value">{fmtDate(session.last_activity_at)}</span>
          </div>
          <div className="session-meta-item">
            <span className="label">Total Events</span>
            <span className="value font-semibold">{session.total_events}</span>
          </div>
          <div className="session-meta-item">
            <span className="label">Page Views</span>
            <span className="value">{session.page_views}</span>
          </div>
          <div className="session-meta-item">
            <span className="label">Clicks</span>
            <span className="value">{session.clicks}</span>
          </div>
          <div className="session-meta-item">
            <span className="label">Pages Visited</span>
            <span className="value">{session.pages_visited?.length ?? 0}</span>
          </div>
        </div>
      ) : (
        <p className="text-muted">Session metadata unavailable.</p>
      )}

      {session?.pages_visited?.length > 0 && (
        <div className="session-pages">
          <span className="label">Pages</span>
          <ul className="pages-list">
            {session.pages_visited.map((p) => (
              <li key={p} className="pages-list-item">
                <span className="page-url">{p.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SessionDetails() {
  const { sessionId } = useParams();
  const [events, setEvents] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    getSessionEvents(decodeURIComponent(sessionId))
      .then((data) => {
        setEvents(data.items ?? []);
        setSession(data.session ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}

      <SessionSummaryCard
        session={session}
        sessionId={decodeURIComponent(sessionId)}
        loading={loading}
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Event Timeline</h2>
          <span className="badge-count">{events.length} events</span>
        </div>
        <EventTimeline events={events} loading={loading} error={null} />
      </div>
    </div>
  );
}
