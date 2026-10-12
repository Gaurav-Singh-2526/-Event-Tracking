import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Overview',
  '/sessions': 'Sessions',
  '/heatmap': 'Heatmap',
  '/analytics': 'Analytics',
};

function getTitle(pathname) {
  if (pathname.startsWith('/sessions/')) return 'Session Details';
  return PAGE_TITLES[pathname] || 'Dashboard';
}

export default function Header() {
  const location = useLocation();
  const title = getTitle(location.pathname);
  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        <span className="topbar-date">{now}</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-badge">Live</span>
      </div>
    </header>
  );
}
