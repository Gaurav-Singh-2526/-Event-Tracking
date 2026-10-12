/**
 * StatCard - displays a single metric with label, value, and icon.
 * Props:
 *   label    - metric name
 *   value    - numeric or string value
 *   icon     - emoji or character
 *   color    - accent color class: 'blue' | 'green' | 'orange' | 'purple'
 *   loading  - shows skeleton when true
 */
export default function StatCard({ label, value, icon, color = 'blue', loading = false }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        {loading ? (
          <div className="stat-skeleton" />
        ) : (
          <div className="stat-value">{value ?? '—'}</div>
        )}
      </div>
    </div>
  );
}
