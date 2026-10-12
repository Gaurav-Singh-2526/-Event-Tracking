import { Router } from 'express';
import Session from '../models/Session.js';
import Event from '../models/Event.js';

const router = Router();

/**
 * GET /api/sessions
 * Returns paginated sessions sorted by latest activity.
 * Query params: page, limit, search (partial session_id)
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const filter = search
      ? { session_id: { $regex: search, $options: 'i' } }
      : {};

    const [total, items] = await Promise.all([
      Session.countDocuments(filter),
      Session.find(filter)
        .sort({ last_activity_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      items: items.map((s) => ({
        session_id: s.session_id,
        started_at: s.started_at,
        last_activity_at: s.last_activity_at,
        total_events: s.total_events,
        page_views: s.page_views,
        clicks: s.clicks,
        pages_visited: s.pages_visited,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/sessions/:sessionId/events
 * Returns events for a session in chronological order.
 */
router.get('/:sessionId/events', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const [session, events] = await Promise.all([
      Session.findOne({ session_id: sessionId }).lean(),
      Event.find({ session_id: sessionId })
        .sort({ timestamp: 1, _id: 1 })
        .select('-__v -createdAt -updatedAt')
        .lean(),
    ]);

    if (!session && events.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session_id: sessionId,
      session: session
        ? {
            started_at: session.started_at,
            last_activity_at: session.last_activity_at,
            total_events: session.total_events,
            page_views: session.page_views,
            clicks: session.clicks,
            pages_visited: session.pages_visited,
          }
        : null,
      items: events.map((e) => ({
        event_type: e.event_type,
        page_url: e.page_url,
        page: e.page,
        timestamp: e.timestamp,
        properties: e.properties || {},
      })),
      total: events.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
