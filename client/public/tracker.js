/**
 * UserPulse Analytics Tracker SDK
 *
 * Tracks page views and click events and sends them to the backend API.
 * Integrates with React Router via window.__tracker.trackPageView().
 *
 * Usage (auto-loaded when placed in public/):
 *   The React app calls window.__tracker.trackPageView() on route changes.
 *   Click events are tracked automatically via a document-level listener.
 *
 * PRIVACY: This SDK does NOT collect passwords, form inputs, access tokens,
 * or any other sensitive user data.
 */
(function () {
  'use strict';

  // Prevent double-initialization (React StrictMode / HMR)
  if (window.__trackerLoaded) return;
  window.__trackerLoaded = true;

  // ── Configuration ─────────────────────────────────────────────────────────
  var ENDPOINT = '/api/events';
  var SESSION_KEY = 'ua_session_id';

  // ── Session ID ────────────────────────────────────────────────────────────
  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getSessionId() {
    var id = null;
    // Use sessionStorage so the ID persists across route navigations
    // but starts fresh when the browser tab is closed
    try {
      id = window.sessionStorage.getItem(SESSION_KEY);
    } catch (e) { /* storage blocked in some private-browsing modes */ }

    if (!id) {
      id = uuid();
      try {
        window.sessionStorage.setItem(SESSION_KEY, id);
      } catch (e) { /* ignore */ }
    }
    return id;
  }

  var SESSION_ID = getSessionId();

  // ── Send ──────────────────────────────────────────────────────────────────
  function send(payload) {
    var body = JSON.stringify(payload);

    // sendBeacon: reliable on page unload, no CORS preflight for text/plain
    if (navigator.sendBeacon) {
      try {
        var sent = navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: 'text/plain' })
        );
        if (sent) return;
      } catch (e) { /* fall through */ }
    }

    // Fetch fallback
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
    }).catch(function () {
      // Tracking must never break the page
    });
  }

  // ── Base event builder ────────────────────────────────────────────────────
  function baseEvent(eventType) {
    return {
      session_id: SESSION_ID,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Page View ─────────────────────────────────────────────────────────────
  var lastPageViewUrl = null;

  function trackPageView() {
    var url = window.location.href;

    // Deduplicate: don't fire twice for the same URL in the same tick
    if (lastPageViewUrl === url) return;
    lastPageViewUrl = url;

    // Reset after a short delay to allow the next navigation to be tracked
    setTimeout(function () {
      if (lastPageViewUrl === url) lastPageViewUrl = null;
    }, 500);

    send(baseEvent('page_view'));
  }

  // Track initial page load
  trackPageView();

  // ── Click Tracking ────────────────────────────────────────────────────────
  document.addEventListener(
    'click',
    function (e) {
      var target = e.target;

      // Safety: ignore clicks on our own invisible elements
      if (target && target.getAttribute && target.getAttribute('data-no-track') === 'true') {
        return;
      }

      // Build element identifier without capturing sensitive content
      var elementTag = target ? (target.tagName || '').toLowerCase() : null;
      var elementId = null;
      if (target && target.id && target.id.length <= 100) {
        // Only store IDs that look safe (no passwords, tokens, etc.)
        elementId = target.id;
      }

      var event = baseEvent('click');
      // Viewport coordinates (relative to the visible viewport)
      event.x = Math.round(e.clientX);
      event.y = Math.round(e.clientY);
      // Document coordinates (absolute position in the full document)
      event.pageX = Math.round(e.pageX);
      event.pageY = Math.round(e.pageY);
      // Viewport dimensions for coordinate normalization
      event.viewport_width = window.innerWidth;
      event.viewport_height = window.innerHeight;
      event.element_tag = elementTag;
      event.element_id = elementId;

      send(event);
    },
    true  // capture phase so we get all clicks
  );

  // ── Expose public API for React Router integration ─────────────────────────
  window.__tracker = {
    trackPageView: trackPageView,
    getSessionId: function () { return SESSION_ID; },
  };
})();
