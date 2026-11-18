// All URLs here match the Express routes in server/src/routes/complaints.js.
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  submitComplaint: (body) => request('/complaints', { method: 'POST', body: JSON.stringify(body) }),

  listComplaints: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    const qs = params.toString();
    return request(`/complaints${qs ? `?${qs}` : ''}`);
  },

  getStats: () => request('/complaints/stats'),
  getComplaint: (id) => request(`/complaints/${id}`),

  updateStatus: (id, status) =>
    request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  reanalyze: (id) => request(`/complaints/${id}/reanalyze`, { method: 'POST' }),
};
