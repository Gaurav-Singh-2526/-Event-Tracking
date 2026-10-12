import { useEffect, useRef, useState } from 'react';

/**
 * HeatmapCanvas - renders click positions on an HTML Canvas.
 * Coordinates are normalized using fx/fy fractions so clicks from different
 * screen sizes remain proportionally correct.
 *
 * Props:
 *   data    - { clicks: [{fx, fy, x, y, element_tag, timestamp}], median_viewport_width, median_viewport_height, total }
 *   mode    - 'heat' | 'dots'
 */

const CANVAS_MAX_WIDTH = 900;

function drawCanvas(canvas, data, mode) {
  if (!canvas || !data) return;

  const refW = data.median_viewport_width || 1280;
  const refH = data.median_viewport_height || 800;

  const scale = Math.min(1, CANVAS_MAX_WIDTH / refW);
  const w = Math.round(refW * scale);
  const h = Math.round(refH * scale);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }

  if (!data.clicks?.length) return;

  for (const c of data.clicks) {
    const cx = c.fx * w;
    const cy = c.fy * h;

    if (mode === 'heat') {
      // Overlapping translucent blobs: busy areas accumulate color
      const r = 30;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.40)');
      grad.addColorStop(0.45, 'rgba(249, 115, 22, 0.18)');
      grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    } else {
      // Dot mode
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.70)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

export default function HeatmapCanvas({ data, mode = 'heat' }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (data && canvasRef.current) {
      drawCanvas(canvasRef.current, data, mode);
    }
  }, [data, mode]);

  // Hover tooltip: find nearest click within 20px
  function handleMouseMove(e) {
    if (!data?.clicks?.length || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const refW = data.median_viewport_width || 1280;
    const refH = data.median_viewport_height || 800;
    const scale = Math.min(1, CANVAS_MAX_WIDTH / refW);
    const w = refW * scale;
    const h = refH * scale;

    let closest = null;
    let closestDist = 20; // pixels threshold

    for (const c of data.clicks) {
      const cx = c.fx * w;
      const cy = c.fy * h;
      const dist = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = c;
      }
    }

    if (closest) {
      setTooltip({
        left: e.clientX - rect.left + 12,
        top: e.clientY - rect.top - 10,
        click: closest,
      });
    } else {
      setTooltip(null);
    }
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  if (!data) return null;

  if (data.total === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⊕</div>
        <p className="empty-title">No click data</p>
        <p className="empty-desc">
          Click around on this page to generate heatmap data.
        </p>
      </div>
    );
  }

  return (
    <div
      className="canvas-container"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', borderRadius: '8px', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="canvas-tooltip"
          style={{
            position: 'absolute',
            left: tooltip.left,
            top: tooltip.top,
            pointerEvents: 'none',
          }}
        >
          <div><strong>Position:</strong> ({tooltip.click.x}, {tooltip.click.y})</div>
          {tooltip.click.element_tag && (
            <div>
              <strong>Element:</strong> &lt;{tooltip.click.element_tag}
              {tooltip.click.element_id ? ` #${tooltip.click.element_id}` : ''}&gt;
            </div>
          )}
          {tooltip.click.timestamp && (
            <div>
              <strong>Time:</strong>{' '}
              {new Date(tooltip.click.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      <p className="canvas-note">
        Showing {data.total} click{data.total !== 1 ? 's' : ''} at ~
        {data.median_viewport_width} × {data.median_viewport_height}px median viewport.
        Hover over a dot for details.
      </p>
    </div>
  );
}
