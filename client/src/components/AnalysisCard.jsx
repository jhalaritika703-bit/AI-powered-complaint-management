import { useState } from 'react';
import Badge from './Badge.jsx';

export default function AnalysisCard({ analysis }) {
  const [copied, setCopied] = useState(false);

  async function copyResponse() {
    try {
      await navigator.clipboard.writeText(analysis.suggestedResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  }

  return (
    <section className="panel analysis" aria-label="AI analysis">
      <h2>AI analysis</h2>

      <div className="analysis-tags">
        <div>
          <span className="field-label">Category</span>
          <Badge kind="category" value={analysis.category} />
        </div>
        <div>
          <span className="field-label">Priority</span>
          <Badge kind="priority" value={analysis.priority} />
        </div>
      </div>
      {analysis.priorityReason && <p className="muted">{analysis.priorityReason}</p>}

      <h3>Summary</h3>
      <p>{analysis.summary}</p>

      <div className="row-between">
        <h3>Suggested response</h3>
        <button type="button" className="btn btn-small" onClick={copyResponse}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="response-box">{analysis.suggestedResponse}</p>
    </section>
  );
}
