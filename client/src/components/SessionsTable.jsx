import { useNavigate } from 'react-router-dom';

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shortId = (id) => (id ? `${id.slice(0, 8)}…` : '—');

/**
 * SessionsTable
 * Props:
 *   sessions  - array of session objects
 *   total     - total record count
 *   page      - current page number (1-based)
 *   pages     - total number of pages
 *   onPage    - (newPage: number) => void
 *   search    - current search string
 *   onSearch  - (value: string) => void
 *   onRefresh - () => void
 *   loading   - boolean
 *   error     - string | null
 */
export default function SessionsTable({
  sessions = [],
  total = 0,
  page = 1,
  pages = 1,
  onPage,
  search,
  onSearch,
  onRefresh,
  loading,
  error,
}) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <h2 className="card-title">User Sessions</h2>
          <span className="badge-count">{total} total</span>
        </div>
        <div className="card-header-right">
          <input
            className="search-input"
            type="text"
            placeholder="Search by session ID…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          <button className="btn btn-outline" onClick={onRefresh} disabled={loading}>
            {loading ? 'Loading…' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="table-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◷</div>
          <p className="empty-title">No sessions found</p>
          <p className="empty-desc">
            {search
              ? 'No sessions match your search. Try a different ID fragment.'
              : 'Navigate around the app to generate your first session.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>First Activity</th>
                <th>Last Activity</th>
                <th className="num">Events</th>
                <th className="num">Views</th>
                <th className="num">Clicks</th>
                <th>Pages Visited</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="table-row clickable"
                  onClick={() => navigate(`/sessions/${encodeURIComponent(s.session_id)}`)}
                >
                  <td>
                    <span className="mono text-accent" title={s.session_id}>
                      {shortId(s.session_id)}
                    </span>
                  </td>
                  <td className="text-muted">{fmtDate(s.started_at)}</td>
                  <td className="text-muted">{fmtDate(s.last_activity_at)}</td>
                  <td className="num font-semibold">{s.total_events}</td>
                  <td className="num">{s.page_views}</td>
                  <td className="num">{s.clicks}</td>
                  <td>
                    <span className="text-muted text-sm">
                      {s.pages_visited?.length ?? 0} page
                      {s.pages_visited?.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => onPage(page - 1)}
          >
            ← Prev
          </button>
          <span className="page-info">
            Page {page} of {pages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={page >= pages || loading}
            onClick={() => onPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
