import { useState, useEffect, useCallback } from 'react';
import SessionsTable from '../components/SessionsTable.jsx';
import { getSessions } from '../services/api.js';

export default function Sessions() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSessions(page, LIMIT, search)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 on new search
  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="page">
      <SessionsTable
        sessions={data.items}
        total={data.total}
        page={page}
        pages={data.pages ?? 1}
        onPage={setPage}
        search={search}
        onSearch={handleSearch}
        onRefresh={load}
        loading={loading}
        error={error}
      />
    </div>
  );
}
