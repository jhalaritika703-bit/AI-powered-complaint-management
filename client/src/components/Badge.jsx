import { slug } from '../constants.js';

// kind: 'priority' | 'status' | 'category'
export default function Badge({ kind, value }) {
  if (!value) return <span className="badge badge-none">Not analyzed</span>;
  return <span className={`badge badge-${kind}-${slug(value)}`}>{value}</span>;
}
