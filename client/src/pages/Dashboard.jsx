import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import StatCard from '../components/StatCard.jsx';
import { getAnalyticsSummary } from '../services/api.js';

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

const CHART_COLORS = ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#ef4444'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAnalyticsSummary()
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = summary?.totals ?? {};
  const recentSessions = summary?.recent_sessions ?? [];
  const popularPages = summary?.popular_pages ?? [];
  const eventDist = (summary?.event_distribution ?? []).map((e) => ({
    name: e.event_type === 'page_view' ? 'Page Views' : 'Clicks',
    count: e.count,
  }));

  return (
    <div className="page">
      {/* Stat Cards */}
      <section className="stats-grid">
        <StatCard
          label="Total Sessions"
          value={totals.sessions?.toLocaleString()}
          icon="◷"
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Total Events"
          value={totals.events?.toLocaleString()}
          icon="⚡"
          color="purple"
          loading={loading}
        />
        <StatCard
          label="Page Views"
          value={totals.page_views?.toLocaleString()}
          icon="▦"
          color="green"
          loading={loading}
        />
        <StatCard
          label="Total Clicks"
          value={totals.clicks?.toLocaleString()}
          icon="⊕"
          color="orange"
          loading={loading}
        />
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        {/* Event Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Event Distribution</h2>
            <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
              ↺
            </button>
          </div>
          {loading ? (
            <div className="chart-skeleton" />
          ) : eventDist.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p className="empty-desc">No events recorded yet. Navigate around the app.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {eventDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Visited Pages */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Most Visited Pages</h2>
          </div>
          {loading ? (
            <div className="list-skeleton">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}
            </div>
          ) : popularPages.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p className="empty-desc">No page views recorded yet.</p>
            </div>
          ) : (
            <ol className="page-rank-list">
              {popularPages.map((p, i) => (
                <li key={p.page} className="page-rank-item">
                  <span className="rank-num">{i + 1}</span>
                  <span className="rank-url" title={p.page}>
                    {p.page.replace(/^https?:\/\/[^/]+/, '') || '/'}
                  </span>
                  <span className="rank-count">{p.page_views} views</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Sessions</h2>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : '↺ Refresh'}
          </button>
        </div>
        {loading ? (
          <div className="table-skeleton">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="empty-state empty-state--sm">
            <p className="empty-desc">No sessions yet. Navigate around to generate tracking data.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Started</th>
                  <th>Last Active</th>
                  <th className="num">Events</th>
                  <th className="num">Views</th>
                  <th className="num">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr key={s.session_id} className="table-row">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
