import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell,
} from 'recharts';
import { getAnalyticsPages } from '../services/api.js';

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#ef4444', '#14b8a6'];

const fmtPage = (url) => url.replace(/^https?:\/\/[^/]+/, '') || '/';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (dateFrom) params.from = new Date(dateFrom).toISOString();
    if (dateTo) params.to = new Date(dateTo).toISOString();
    getAnalyticsPages(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const pages = data?.pages ?? [];
  const eventTypes = data?.event_types ?? [];
  const sessionsByDay = data?.sessions_by_day ?? [];

  // Sort pages by page_views desc for the chart (top 8)
  const topPages = [...pages]
    .sort((a, b) => b.page_views - a.page_views)
    .slice(0, 8)
    .map((p) => ({ ...p, label: fmtPage(p.page) }));

  return (
    <div className="page">
      {/* Date Range Filter */}
      <div className="card filter-bar">
        <div className="filter-controls">
          <div className="filter-group">
            <label className="toolbar-label" htmlFor="from-date">From</label>
            <input
              id="from-date"
              type="date"
              className="date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="toolbar-label" htmlFor="to-date">To</label>
            <input
              id="to-date"
              type="date"
              className="date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Apply'}
          </button>
          {(dateFrom || dateTo) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="analytics-grid">
        {/* Page Views by Page */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Page Views by Page</h2>
          </div>
          {loading ? (
            <div className="chart-skeleton" />
          ) : topPages.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p className="empty-desc">No page view data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topPages} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                  formatter={(val) => [val, 'Page Views']}
                />
                <Bar dataKey="page_views" radius={[0, 4, 4, 0]}>
                  {topPages.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Clicks by Page */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Clicks by Page</h2>
          </div>
          {loading ? (
            <div className="chart-skeleton" />
          ) : topPages.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p className="empty-desc">No click data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topPages} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                  formatter={(val) => [val, 'Clicks']}
                />
                <Bar dataKey="clicks" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="analytics-grid analytics-grid--thirds">
        {/* Event Type Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Events by Type</h2>
          </div>
          {loading ? (
            <div className="list-skeleton">
              {[...Array(2)].map((_, i) => <div key={i} className="skeleton-row" />)}
            </div>
          ) : eventTypes.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p className="empty-desc">No events recorded yet.</p>
            </div>
          ) : (
            <ul className="event-type-list">
              {eventTypes.map((et, i) => (
                <li key={et.event_type} className="event-type-item">
                  <span
                    className="event-type-dot"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="event-type-name">
                    {et.event_type === 'page_view' ? 'Page Views' : 'Clicks'}
                  </span>
                  <span className="event-type-count">{et.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Page Detail Table */}
        <div className="card analytics-table-card">
          <div className="card-header">
            <h2 className="card-title">Page Analytics</h2>
          </div>
          {loading ? (
            <div className="table-skeleton">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}
            </div>
          ) : pages.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p className="empty-desc">No page data yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th className="num">Views</th>
                    <th className="num">Clicks</th>
                    <th className="num">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pages]
                    .sort((a, b) => b.page_views - a.page_views)
                    .map((p) => (
                      <tr key={p.page} className="table-row">
                        <td className="text-sm" title={p.page}>
                          {fmtPage(p.page)}
                        </td>
                        <td className="num">{p.page_views}</td>
                        <td className="num">{p.clicks}</td>
                        <td className="num">{p.unique_sessions}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Session Activity Over Time */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Session Activity (Last 30 Days)</h2>
        </div>
        {loading ? (
          <div className="chart-skeleton" style={{ height: 200 }} />
        ) : sessionsByDay.length === 0 ? (
          <div className="empty-state empty-state--sm">
            <p className="empty-desc">No session data for the last 30 days.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sessionsByDay} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Sessions"
              />
              <Line
                type="monotone"
                dataKey="events"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Events"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
