/**
 * EventTimeline - renders a chronological list of session events.
 * Props:
 *   events  - array of event objects
 *   loading - boolean
 *   error   - string | null
 */

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function EventBadge({ type }) {
  return (
    <span className={`event-badge event-badge--${type === 'click' ? 'click' : 'pageview'}`}>
      {type === 'page_view' ? 'page view' : 'click'}
    </span>
  );
}

function EventItem({ event, index }) {
  const props = event.properties || {};
  const hasClick = event.event_type === 'click';

  return (
    <li className="timeline-item">
      <div className="timeline-marker" />
      <div className="timeline-content">
        <div className="timeline-header">
          <EventBadge type={event.event_type} />
          <span className="timeline-time">{fmtTime(event.timestamp)}</span>
        </div>
        <div className="timeline-url">{event.page_url}</div>
        {hasClick && (
          <div className="timeline-meta">
            <span className="meta-chip">x: {props.x ?? '?'}, y: {props.y ?? '?'}</span>
            {props.element_tag && (
              <span className="meta-chip">
                &lt;{props.element_tag}
                {props.element_id ? ` #${props.element_id}` : ''}
                &gt;
              </span>
            )}
            <span className="meta-chip">
              {props.viewport_width ?? '?'} × {props.viewport_height ?? '?'}px
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

export default function EventTimeline({ events = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className="timeline-skeleton">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◷</div>
        <p className="empty-title">No events found</p>
        <p className="empty-desc">This session has no recorded events.</p>
      </div>
    );
  }

  // Group by date for better readability
  const groups = [];
  let currentDate = null;

  for (const event of events) {
    const date = fmtDate(event.timestamp);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, events: [] });
    }
    groups[groups.length - 1].events.push(event);
  }

  return (
    <div className="timeline">
      {groups.map((group) => (
        <div key={group.date} className="timeline-group">
          <div className="timeline-date-divider">{group.date}</div>
          <ul className="timeline-list">
            {group.events.map((event, i) => (
              <EventItem key={i} event={event} index={i} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
