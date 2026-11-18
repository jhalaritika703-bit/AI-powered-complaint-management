export const CATEGORIES = ['Delivery', 'Payment', 'Product', 'Service', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Pending', 'In Progress', 'Resolved'];

export const PRIORITY_RANK = { High: 3, Medium: 2, Low: 1 };

export const slug = (value) => String(value).toLowerCase().replace(/\s+/g, '-');

export const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
