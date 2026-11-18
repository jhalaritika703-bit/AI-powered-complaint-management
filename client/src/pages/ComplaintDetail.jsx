import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import AnalysisCard from '../components/AnalysisCard.jsx';
import Badge from '../components/Badge.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';
import { STATUSES, formatDate } from '../constants.js';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(''); // '', 'status', 'reanalyze'

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api
      .getComplaint(id)
      .then(({ complaint }) => setComplaint(complaint))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  async function changeStatus(status) {
    if (status === complaint.status) return;
    setActionError('');
    setBusy('status');
    try {
      const { complaint: updated } = await api.updateStatus(id, status);
      setComplaint(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function rerunAnalysis() {
    setActionError('');
    setBusy('reanalyze');
    try {
      const { complaint: updated } = await api.reanalyze(id);
      setComplaint(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <div className="panel empty">
        <Spinner label="Loading complaint" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="stack">
        <ErrorMessage message={loadError} onRetry={load} />
        <Link to="/admin">Back to complaints</Link>
      </div>
    );
  }

  const c = complaint;
  const mailto = c.analysis
    ? `mailto:${c.email}?subject=${encodeURIComponent('Regarding your complaint')}&body=${encodeURIComponent(
        c.analysis.suggestedResponse
      )}`
    : `mailto:${c.email}`;

  return (
    <div className="stack">
      <Link to="/admin" className="back">
        ← All complaints
      </Link>

      <div className="row-between wrap">
        <h1>{c.customerName}</h1>
        <Badge kind="status" value={c.status} />
      </div>

      <ErrorMessage message={actionError} />

      <section className="panel">
        <h2>Complaint</h2>
        <p className="muted small">
          {c.email} · received {formatDate(c.createdAt)}
        </p>
        <p className="pre">{c.description}</p>
      </section>

      <section className="panel">
        <h2>Status</h2>
        <div className="segmented" role="group" aria-label="Complaint status">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={s === c.status ? 'active' : ''}
              aria-pressed={s === c.status}
              disabled={busy === 'status'}
              onClick={() => changeStatus(s)}
            >
              {s}
            </button>
          ))}
          {busy === 'status' && <Spinner label="Saving status" />}
        </div>

        {c.statusHistory?.length > 0 && (
          <ul className="history">
            {[...c.statusHistory].reverse().map((h, i) => (
              <li key={i}>
                <strong>{h.status}</strong>
                <span className="muted small">{formatDate(h.changedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {c.aiStatus === 'success' && c.analysis ? (
        <>
          <AnalysisCard analysis={c.analysis} />
          <div className="actions">
            <a className="btn btn-primary" href={mailto}>
              Reply by email
            </a>
            <button type="button" className="btn" onClick={rerunAnalysis} disabled={busy === 'reanalyze'}>
              {busy === 'reanalyze' ? (
                <>
                  <Spinner label="Analyzing" /> Analyzing…
                </>
              ) : (
                'Re-run AI analysis'
              )}
            </button>
          </div>
        </>
      ) : (
        <section className="panel">
          <h2>AI analysis</h2>
          <p>Automatic analysis did not complete for this complaint.</p>
          <button type="button" className="btn btn-primary" onClick={rerunAnalysis} disabled={busy === 'reanalyze'}>
            {busy === 'reanalyze' ? (
              <>
                <Spinner label="Analyzing" /> Analyzing…
              </>
            ) : (
              'Run AI analysis'
            )}
          </button>
        </section>
      )}
    </div>
  );
}
