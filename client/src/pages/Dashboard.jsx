import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Badge from '../components/Badge.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';
import { CATEGORIES, PRIORITIES, PRIORITY_RANK, STATUSES, formatDate, slug } from '../constants.js';

const NO_FILTERS = { category: '', priority: '', status: '' };

export default function Dashboard() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState('newest');
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false; // ignore stale responses when filters change quickly
    setLoading(true);
    setError('');
    Promise.all([api.listComplaints(filters), api.getStats()])
      .then(([list, s]) => {
        if (ignore) return;
        setComplaints(list.complaints);
        setStats(s.stats);
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [filters, reloadKey]);

  const visible = useMemo(() => {
    if (sort !== 'priority') return complaints;
    return [...complaints].sort(
      (a, b) => (PRIORITY_RANK[b.analysis?.priority] || 0) - (PRIORITY_RANK[a.analysis?.priority] || 0)
    );
  }, [complaints, sort]);

  const setFilter = (name) => (e) => setFilters((f) => ({ ...f, [name]: e.target.value }));
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="stack">
      <h1>Complaints</h1>

      {stats && (
        <div className="stats">
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="In progress" value={stats.inProgress} />
          <Stat label="Resolved" value={stats.resolved} />
          <Stat label="High priority, still open" value={stats.urgentOpen} urgent />
        </div>
      )}

      <div className="panel filters">
        <Select label="Category" value={filters.category} onChange={setFilter('category')} options={CATEGORIES} />
        <Select label="Priority" value={filters.priority} onChange={setFilter('priority')} options={PRIORITIES} />
        <Select label="Status" value={filters.status} onChange={setFilter('status')} options={STATUSES} />
        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="priority">Highest priority first</option>
          </select>
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-small" onClick={() => setFilters(NO_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>

      <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />

      {loading ? (
        <div className="panel empty">
          <Spinner label="Loading complaints" />
        </div>
      ) : !error && visible.length === 0 ? (
        <div className="panel empty">
          <p>
            {hasFilters
              ? 'No complaints match these filters.'
              : 'No complaints yet. Submitted complaints will appear here.'}
          </p>
        </div>
      ) : (
        <ul className="list">
          {visible.map((c) => (
            <li key={c._id}>
              <Link
                to={`/admin/complaints/${c._id}`}
                className={`row edge-${c.analysis?.priority ? slug(c.analysis.priority) : 'none'}`}
              >
                <div className="row-main">
                  <strong>{c.customerName}</strong>
                  <span className="muted small">{c.email}</span>
                </div>
                <p className="row-summary">
                  {c.analysis?.summary || 'Analysis pending. Open the complaint to retry.'}
                </p>
                <div className="row-badges">
                  <Badge kind="category" value={c.analysis?.category} />
                  <Badge kind="priority" value={c.analysis?.priority} />
                  <Badge kind="status" value={c.status} />
                </div>
                <span className="muted small row-date">{formatDate(c.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, urgent }) {
  return (
    <div className={`panel stat ${urgent && value > 0 ? 'stat-urgent' : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="muted small">{label}</span>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  const id = `filter-${label}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
