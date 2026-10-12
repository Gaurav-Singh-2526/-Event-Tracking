import { Router } from 'express';
import Event from '../models/Event.js';
import Session from '../models/Session.js';

const router = Router();

/**
 * GET /api/analytics/summary
 * Returns dashboard totals, recent sessions, and popular pages.
 */
router.get('/summary', async (req, res, next) => {
  try {
    const [
      totalSessions,
      totalEvents,
      eventTypeCounts,
      recentSessions,
      popularPages,
    ] = await Promise.all([
      Session.countDocuments(),
      Event.countDocuments(),
      Event.aggregate([
        {
          $group: {
            _id: '$event_type',
            count: { $sum: 1 },
          },
        },
      ]),
      Session.find()
        .sort({ last_activity_at: -1 })
        .limit(5)
        .lean(),
      Event.aggregate([
        { $match: { event_type: 'page_view' } },
        {
          $group: {
            _id: '$page',
            page_views: { $sum: 1 },
          },
        },
        { $sort: { page_views: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalPageViews = eventTypeCounts.find((e) => e._id === 'page_view')?.count ?? 0;
    const totalClicks = eventTypeCounts.find((e) => e._id === 'click')?.count ?? 0;

    res.json({
      totals: {
        sessions: totalSessions,
        events: totalEvents,
        page_views: totalPageViews,
        clicks: totalClicks,
      },
      recent_sessions: recentSessions.map((s) => ({
        session_id: s.session_id,
        started_at: s.started_at,
        last_activity_at: s.last_activity_at,
        total_events: s.total_events,
        page_views: s.page_views,
        clicks: s.clicks,
        pages_visited: s.pages_visited,
      })),
      popular_pages: popularPages.map(({ _id, page_views }) => ({
        page: _id,
        page_views,
      })),
      event_distribution: eventTypeCounts.map(({ _id, count }) => ({
        event_type: _id,
        count,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/pages
 * Returns per-page analytics: page views, clicks, and click rate.
 * Supports optional date range: ?from=ISO&to=ISO
 */
router.get('/pages', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) dateFilter.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) dateFilter.$lte = d;
    }

    const matchStage = Object.keys(dateFilter).length
      ? { $match: { timestamp: dateFilter } }
      : { $match: {} };

    const pages = await Event.aggregate([
      matchStage,
      {
        $group: {
          _id: '$page',
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          unique_sessions: { $addToSet: '$session_id' },
          last_seen: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          page: '$_id',
          page_views: 1,
          clicks: 1,
          unique_sessions: { $size: '$unique_sessions' },
          last_seen: 1,
        },
      },
      { $sort: { page_views: -1 } },
    ]);

    // Event type breakdown
    const eventTypes = await Event.aggregate([
      matchStage,
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Session activity: sessions per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessionsByDay = await Session.aggregate([
      { $match: { started_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$started_at' },
          },
          sessions: { $sum: 1 },
          events: { $sum: '$total_events' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      pages: pages.map(({ _id, ...rest }) => ({ page: _id, ...rest })),
      event_types: eventTypes.map(({ _id, count }) => ({ event_type: _id, count })),
      sessions_by_day: sessionsByDay.map(({ _id, ...rest }) => ({ date: _id, ...rest })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
