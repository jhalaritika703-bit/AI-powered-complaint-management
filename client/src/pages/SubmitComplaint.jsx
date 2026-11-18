import { useState } from 'react';
import { api } from '../api.js';
import AnalysisCard from '../components/AnalysisCard.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';

const EMPTY = { customerName: '', email: '', description: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors the server rules so people get instant feedback; the server still validates everything.
function validate(values) {
  const errors = {};
  if (values.customerName.trim().length < 2) errors.customerName = 'Enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  const len = values.description.trim().length;
  if (len < 10) errors.description = 'Describe the issue in at least 10 characters.';
  else if (len > 2000) errors.description = 'Please keep the description under 2000 characters.';
  return errors;
}

export default function SubmitComplaint() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const { complaint } = await api.submitComplaint({
        customerName: values.customerName.trim(),
        email: values.email.trim(),
        description: values.description.trim(),
      });
      setResult(complaint);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setValues(EMPTY);
    setErrors({});
    setResult(null);
  }

  if (result) {
    return (
      <div className="stack narrow">
        <div className="alert alert-success" role="status">
          <strong>Complaint received.</strong> Reference <code>{result._id.slice(-6)}</code>. We will email{' '}
          {result.email} once we have looked into it.
        </div>

        {result.aiStatus === 'success' ? (
          <AnalysisCard analysis={result.analysis} />
        ) : (
          <div className="alert alert-warn" role="status">
            Your complaint is saved, but automatic analysis is unavailable right now. Our team will review it manually.
          </div>
        )}

        <button type="button" className="btn" onClick={reset}>
          Submit another complaint
        </button>
      </div>
    );
  }

  return (
    <div className="narrow">
      <h1>Tell us what went wrong</h1>
      <p className="lead">Describe the problem and we will route it to the right person.</p>

      <form className="panel form" onSubmit={onSubmit} noValidate>
        <ErrorMessage message={serverError} />

        <label htmlFor="customerName">Your name</label>
        <input
          id="customerName"
          name="customerName"
          value={values.customerName}
          onChange={onChange}
          maxLength={100}
          autoComplete="name"
          aria-invalid={!!errors.customerName}
          disabled={submitting}
        />
        {errors.customerName && <p className="field-error">{errors.customerName}</p>}

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={onChange}
          maxLength={254}
          autoComplete="email"
          aria-invalid={!!errors.email}
          disabled={submitting}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}

        <label htmlFor="description">What happened?</label>
        <textarea
          id="description"
          name="description"
          rows={6}
          value={values.description}
          onChange={onChange}
          maxLength={2000}
          aria-invalid={!!errors.description}
          disabled={submitting}
        />
        <div className="row-between">
          {errors.description ? <p className="field-error">{errors.description}</p> : <span />}
          <span className="muted small">{values.description.length}/2000</span>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner label="Submitting" /> Analyzing your complaint…
            </>
          ) : (
            'Submit complaint'
          )}
        </button>
      </form>
    </div>
  );
}
