import { Router } from 'express';
import Event from '../models/Event.js';

const router = Router();

/**
 * GET /api/pages
 * Returns unique tracked page URLs with view and click counts.
 */
router.get('/', async (req, res, next) => {
  try {
    const items = await Event.aggregate([
      {
        $group: {
          _id: '$page',
          page_url_sample: { $first: '$page_url' },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          last_seen: { $max: '$timestamp' },
        },
      },
      { $sort: { page_views: -1 } },
    ]);

    res.json({
      items: items.map(({ _id, page_url_sample, ...rest }) => ({
        page: _id,
        ...rest,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/pages/clicks?url=<encoded-url>
 * Returns click positions for a given page URL.
 * Includes viewport metadata, timestamps, and session IDs.
 */
router.get('/clicks', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'url query parameter is required' });
    }

    // Normalize: accept full URL or already-normalized page path
    let page = url;
    try {
      const u = new URL(url);
      page = u.origin + u.pathname;
    } catch {
      /* use as-is */
    }

    const clicks = await Event.find({ page, event_type: 'click' })
      .select('session_id page_url timestamp properties -_id')
      .sort({ timestamp: 1 })
      .limit(20000)
      .lean();

    // Compute median viewport size so the canvas can scale correctly
    const widths = clicks.map((c) => c.properties?.viewport_width).filter(Boolean);
    const heights = clicks.map((c) => c.properties?.viewport_height).filter(Boolean);
    const median = (arr) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    };

    res.json({
      page,
      total: clicks.length,
      median_viewport_width: median(widths),
      median_viewport_height: median(heights),
      clicks: clicks.map((c) => ({
        session_id: c.session_id,
        page_url: c.page_url,
        timestamp: c.timestamp,
        x: c.properties?.x ?? 0,
        y: c.properties?.y ?? 0,
        pageX: c.properties?.pageX ?? 0,
        pageY: c.properties?.pageY ?? 0,
        viewport_width: c.properties?.viewport_width ?? 0,
        viewport_height: c.properties?.viewport_height ?? 0,
        element_tag: c.properties?.element_tag ?? null,
        element_id: c.properties?.element_id ?? null,
        // Normalized fractions for canvas rendering
        fx: c.properties?.viewport_width
          ? Math.min(1, (c.properties?.x ?? 0) / c.properties.viewport_width)
          : 0,
        fy: c.properties?.viewport_height
          ? Math.min(1, (c.properties?.y ?? 0) / c.properties.viewport_height)
          : 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
