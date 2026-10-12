import { Router } from 'express';
import Event from '../models/Event.js';
import Session from '../models/Session.js';

const router = Router();

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const MAX_BATCH = 50;

/**
 * Validate a raw event payload and return a structured document or null.
 */
function parseEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const { session_id, event_type, page_url, timestamp } = raw;

  if (typeof session_id !== 'string' || !session_id.trim() || session_id.length > 100) return null;
  if (!['page_view', 'click'].includes(event_type)) return null;
  if (typeof page_url !== 'string' || !page_url || page_url.length > 2048) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(page_url);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return null;

  const ts = timestamp ? new Date(timestamp) : new Date();
  if (isNaN(ts.getTime())) return null;

  // Normalized page path (origin + pathname) for heatmap grouping
  const page = parsedUrl.origin + parsedUrl.pathname;

  const doc = {
    session_id: session_id.trim(),
    event_type,
    page_url,
    page,
    timestamp: ts,
    properties: {},
  };

  if (event_type === 'click') {
    const { x, y, pageX, pageY, viewport_width, viewport_height, element_tag, element_id } = raw;

    // Viewport coordinates are required for click events
    if (!isNum(x) || !isNum(y) || x < 0 || y < 0) return null;
    if (!isNum(viewport_width) || !isNum(viewport_height) || viewport_width <= 0 || viewport_height <= 0) {
      return null;
    }

    doc.properties = {
      x: Math.round(x),
      y: Math.round(y),
      pageX: isNum(pageX) ? Math.round(pageX) : Math.round(x),
      pageY: isNum(pageY) ? Math.round(pageY) : Math.round(y),
      viewport_width: Math.round(viewport_width),
      viewport_height: Math.round(viewport_height),
      element_tag: typeof element_tag === 'string' ? element_tag.slice(0, 50) : null,
      element_id: typeof element_id === 'string' ? element_id.slice(0, 100) : null,
    };
  }

  return doc;
}

/**
 * POST /api/events
 * Accept single event or { events: [...] } batch.
 */
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;

    // Support both a single event object and a batch
    const list = Array.isArray(body)
      ? body
      : Array.isArray(body?.events)
      ? body.events
      : [body];

    if (list.length === 0 || list.length > MAX_BATCH) {
      return res.status(400).json({ error: `Send between 1 and ${MAX_BATCH} events per request` });
    }

    const docs = list.map(parseEvent);
    const invalid = docs.findIndex((d) => d === null);
    if (invalid !== -1) {
      return res.status(400).json({ error: `Invalid event payload at index ${invalid}` });
    }

    // Insert events
    const insertedEvents = await Event.insertMany(docs);

    // Update session records in parallel
    const sessionUpdates = {};
    for (const doc of docs) {
      if (!sessionUpdates[doc.session_id]) {
        sessionUpdates[doc.session_id] = {
          session_id: doc.session_id,
          timestamps: [],
          page_views: 0,
          clicks: 0,
          pages: new Set(),
        };
      }
      const s = sessionUpdates[doc.session_id];
      s.timestamps.push(doc.timestamp);
      if (doc.event_type === 'page_view') s.page_views++;
      if (doc.event_type === 'click') s.clicks++;
      s.pages.add(doc.page);
    }

    await Promise.all(
      Object.values(sessionUpdates).map(async (su) => {
        const minTs = new Date(Math.min(...su.timestamps.map((t) => t.getTime())));
        const maxTs = new Date(Math.max(...su.timestamps.map((t) => t.getTime())));

        await Session.findOneAndUpdate(
          { session_id: su.session_id },
          {
            $setOnInsert: { session_id: su.session_id, started_at: minTs },
            $set: { last_activity_at: maxTs },
            $inc: {
              total_events: su.page_views + su.clicks,
              page_views: su.page_views,
              clicks: su.clicks,
            },
            $addToSet: { pages_visited: { $each: [...su.pages] } },
          },
          { upsert: true, new: true }
        );
      })
    );

    res.status(201).json({ stored: insertedEvents.length });
  } catch (err) {
    next(err);
  }
});

export default router;
