# UserPulse Analytics

A full-stack user analytics web application inspired by CausalFunnel. It tracks real user interactions on its own pages and displays them through a professional analytics dashboard — no separate demo website needed.

---

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React 18 + Vite 5                  |
| Routing   | React Router v6                    |
| HTTP      | Axios                              |
| Charts    | Recharts                           |
| Styling   | Plain CSS (no Tailwind)            |
| Backend   | Node.js + Express.js               |
| Database  | MongoDB + Mongoose                 |
| Env vars  | dotenv                             |

---

## Project Structure

```
user-analytics/
├── client/                     # React + Vite frontend
│   ├── public/
│   │   └── tracker.js          # Analytics tracking SDK
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── SessionsTable.jsx
│   │   │   ├── EventTimeline.jsx
│   │   │   └── HeatmapCanvas.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Sessions.jsx
│   │   │   ├── SessionDetails.jsx
│   │   │   ├── Heatmap.jsx
│   │   │   └── Analytics.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express backend
│   ├── config/
│   │   └── db.js               # Mongoose connection
│   ├── models/
│   │   ├── Event.js
│   │   └── Session.js
│   ├── routes/
│   │   ├── events.js
│   │   ├── sessions.js
│   │   ├── pages.js
│   │   └── analytics.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Quick Start (Windows PowerShell)

### Prerequisites

- Node.js 18+ — https://nodejs.org
- MongoDB Community Server (local) — https://www.mongodb.com/try/download/community
  **or** a free MongoDB Atlas cluster — https://cloud.mongodb.com

---

### Step 1 — Clone / navigate to the project

```powershell
cd D:\placementPractice\user-analytics
```

---

### Step 2 — Install backend dependencies

```powershell
cd server
npm install
cd ..
```

---

### Step 3 — Configure the backend environment

```powershell
Copy-Item server\.env.example server\.env
```

Edit `server\.env` with your values:

```
# Local MongoDB (default)
MONGODB_URI=mongodb://127.0.0.1:27017/user_analytics
PORT=8000
CLIENT_ORIGIN=http://localhost:5173
```

> **Using MongoDB Atlas?** Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/user_analytics?retryWrites=true&w=majority`

---

### Step 4 — Start MongoDB (local only)

If using a local MongoDB installation, open a **new** PowerShell window and run:

```powershell
mongod --dbpath "C:\data\db"
```

> Skip this step if you are using MongoDB Atlas.

---

### Step 5 — Start the backend

```powershell
cd server
npm run dev
```

You should see:
```
MongoDB connected: 127.0.0.1
🚀 API running on http://localhost:8000
   Health: http://localhost:8000/api/health
```

---

### Step 6 — Install frontend dependencies

Open a **new** PowerShell window:

```powershell
cd D:\placementPractice\user-analytics\client
npm install
```

---

### Step 7 — Start the frontend

```powershell
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in Xs
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. The tracker immediately fires a `page_view` event.

---

## Verifying the Application

### Check backend health

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content
```

Expected response:
```json
{ "status": "ok", "database": "connected", "uptime": 12 }
```

### Test event ingestion

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/events" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"session_id":"test-abc-123","event_type":"page_view","page_url":"http://localhost:5173/","timestamp":"2024-01-01T12:00:00.000Z"}'
```

Expected: `{"stored":1}`

### Check sessions

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/sessions" | Select-Object -ExpandProperty Content
```

### Check page clicks

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/pages/clicks?url=http%3A%2F%2Flocalhost%3A5173%2F" | Select-Object -ExpandProperty Content
```

### Check analytics summary

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/analytics/summary" | Select-Object -ExpandProperty Content
```

---

## How Tracking Works

1. `client/public/tracker.js` loads before React (via `<script>` in `index.html`).
2. On load, the SDK reads or creates a session ID stored in `sessionStorage`.
3. A `page_view` event is sent immediately.
4. `App.jsx` contains a `TrackerIntegration` component that calls `window.__tracker.trackPageView()` on every React Router route change.
5. All clicks on the page are captured via a document-level listener and sent as `click` events with viewport coordinates.
6. Events are `POST`ed to `/api/events` (proxied to the backend at port 8000).
7. The backend saves each event and upserts the corresponding session record.

### What is tracked

| Event        | Data collected                                                       |
|--------------|----------------------------------------------------------------------|
| `page_view`  | session_id, page_url, timestamp                                      |
| `click`      | session_id, page_url, timestamp, x/y viewport coords, pageX/pageY document coords, viewport_width, viewport_height, element_tag, element_id |

### What is never tracked

- Form input values
- Passwords or tokens
- Personally identifiable information beyond session_id

---

## API Reference

### POST /api/events

Accept a single event or a batch `{ events: [...] }`.

```json
{
  "session_id": "abc-123",
  "event_type": "page_view",
  "page_url": "http://localhost:5173/sessions",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Click event additional fields:
```json
{
  "x": 450, "y": 320,
  "pageX": 450, "pageY": 320,
  "viewport_width": 1440, "viewport_height": 900,
  "element_tag": "button",
  "element_id": "refresh-btn"
}
```

---

### GET /api/sessions

```
GET /api/sessions?page=1&limit=20&search=abc
```

Response: `{ items: [...], total, page, limit, pages }`

---

### GET /api/sessions/:sessionId/events

Returns events in chronological order for a session.

Response: `{ session_id, session: {...}, items: [...], total }`

---

### GET /api/pages

Returns all unique tracked pages with view/click counts.

---

### GET /api/pages/clicks?url=

```
GET /api/pages/clicks?url=http%3A%2F%2Flocalhost%3A5173%2F
```

Returns click coordinates with `fx`/`fy` normalized fractions for canvas rendering.

---

### GET /api/analytics/summary

Returns dashboard totals, 5 recent sessions, 5 most-visited pages, and event distribution.

---

### GET /api/analytics/pages

```
GET /api/analytics/pages?from=2024-01-01&to=2024-12-31
```

Returns per-page analytics, event type breakdown, and 30-day session activity.

---

### GET /api/health

Returns backend status and database connection state.

---

## Dashboard Pages

| Route                    | Description                                        |
|--------------------------|----------------------------------------------------|
| `/`                      | Overview — totals, recent sessions, charts         |
| `/sessions`              | All sessions — search, sort, paginate              |
| `/sessions/:sessionId`   | Session detail — summary + full event timeline     |
| `/heatmap`               | Click heatmap — page dropdown, heat/dots modes     |
| `/analytics`             | Page analytics — charts, event types, date filter  |

---

## Architecture

```
Browser (React app + tracker.js)
         │
         │  POST /api/events  (fetch / sendBeacon)
         ▼
Express.js (port 8000)
  ├── POST /api/events      → Event.insertMany + Session.findOneAndUpdate
  ├── GET  /api/sessions    → Session.find (paginated)
  ├── GET  /api/sessions/:id/events → Event.find
  ├── GET  /api/pages       → Event.aggregate
  ├── GET  /api/pages/clicks → Event.find (type=click, page=X)
  ├── GET  /api/analytics/summary → Session+Event counts
  ├── GET  /api/analytics/pages   → Event.aggregate (per-page)
  └── GET  /api/health
         │
         ▼
MongoDB (Mongoose)
  ├── events collection  (indexes: session_id+timestamp, page+event_type, timestamp)
  └── sessions collection (index: session_id unique, last_activity_at)
```

---

## Troubleshooting

### "MongoDB connection error"

- Ensure `mongod` is running locally, or your Atlas connection string is correct.
- Check that `MONGODB_URI` in `server/.env` is set.

### "CORS error" in browser

- Confirm `CLIENT_ORIGIN=http://localhost:5173` in `server/.env`.
- Confirm the backend is running on port 8000.
- The Vite dev server proxies `/api` to `http://localhost:8000` automatically.

### "Events not appearing" in dashboard

- Open DevTools Network tab and check that `POST /api/events` returns `{"stored":1}`.
- The dashboard auto-loads on mount — click **↺ Refresh** to reload data.

### Sessions page is empty

- Navigate to other pages (Sessions, Heatmap, Analytics) and click around.
- Each navigation creates a `page_view` event; each click creates a `click` event.
- Return to the Sessions page and click Refresh.

### Port conflicts

Change ports in `server/.env` (PORT) and `client/vite.config.js` (server.port) as needed.

---

## Environment Variables

| Variable         | Default                                      | Description                        |
|------------------|----------------------------------------------|------------------------------------|
| `MONGODB_URI`    | `mongodb://127.0.0.1:27017/user_analytics`   | MongoDB connection string           |
| `PORT`           | `8000`                                       | Backend port                        |
| `CLIENT_ORIGIN`  | `http://localhost:5173`                      | Frontend origin for CORS            |
