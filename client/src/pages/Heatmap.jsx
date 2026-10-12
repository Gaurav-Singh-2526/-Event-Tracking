import { useEffect, useState, useCallback } from 'react';
import HeatmapCanvas from '../components/HeatmapCanvas.jsx';
import { getPages, getPageClicks } from '../services/api.js';

export default function Heatmap() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('heat');
  const [pagesLoading, setPagesLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [pagesError, setPagesError] = useState(null);
  const [dataError, setDataError] = useState(null);

  // Load available pages on mount
  useEffect(() => {
    setPagesLoading(true);
    setPagesError(null);
    getPages()
      .then((res) => {
        const withClicks = (res.items ?? []).filter((p) => p.clicks > 0);
        setPages(withClicks);
        if (withClicks.length > 0) setSelectedPage(withClicks[0].page);
      })
      .catch((e) => setPagesError(e.message))
      .finally(() => setPagesLoading(false));
  }, []);

  // Load click data whenever selected page changes
  const loadClicks = useCallback(() => {
    if (!selectedPage) return;
    setDataLoading(true);
    setDataError(null);
    setData(null);
    getPageClicks(selectedPage)
      .then(setData)
      .catch((e) => setDataError(e.message))
      .finally(() => setDataLoading(false));
  }, [selectedPage]);

  useEffect(() => { loadClicks(); }, [loadClicks]);

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Click Heatmap</h2>
          <div className="heatmap-toolbar">
            <div className="toolbar-group">
              <label className="toolbar-label" htmlFor="page-select">Page</label>
              <select
                id="page-select"
                className="select"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                disabled={pagesLoading || pages.length === 0}
              >
                {pagesLoading && <option>Loading pages…</option>}
                {!pagesLoading && pages.length === 0 && (
                  <option>No pages with clicks yet</option>
                )}
                {pages.map((p) => (
                  <option key={p.page} value={p.page}>
                    {p.page.replace(/^https?:\/\/[^/]+/, '') || '/'} ({p.clicks} click{p.clicks !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="seg-buttons">
              <button
                className={mode === 'heat' ? 'seg-btn seg-btn--active' : 'seg-btn'}
                onClick={() => setMode('heat')}
              >
                Heat
              </button>
              <button
                className={mode === 'dots' ? 'seg-btn seg-btn--active' : 'seg-btn'}
                onClick={() => setMode('dots')}
              >
                Dots
              </button>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={loadClicks}
              disabled={!selectedPage || dataLoading}
            >
              {dataLoading ? 'Loading…' : '↺ Refresh'}
            </button>

            {data && <span className="badge-count">{data.total} clicks</span>}
          </div>
        </div>

        {pagesError && <div className="alert alert-error">{pagesError}</div>}
        {dataError && <div className="alert alert-error">{dataError}</div>}

        {!pagesLoading && pages.length === 0 && !pagesError && (
          <div className="empty-state">
            <div className="empty-icon">⊕</div>
            <p className="empty-title">No click data yet</p>
            <p className="empty-desc">
              Click buttons, links, and navigation items throughout the app to generate
              heatmap data. Then return here to visualize it.
            </p>
          </div>
        )}

        {dataLoading && <div className="chart-skeleton" style={{ height: 300 }} />}

        {!dataLoading && data && (
          <div className="heatmap-canvas-wrap">
            <HeatmapCanvas data={data} mode={mode} />
          </div>
        )}

        {data && data.total > 0 && (
          <p className="heatmap-note">
            This is a coordinate map of recorded clicks — not an overlay of the original page.
            Click positions are normalized to median viewport dimensions ({data.median_viewport_width} × {data.median_viewport_height}px).
          </p>
        )}
      </div>
    </div>
  );
}
