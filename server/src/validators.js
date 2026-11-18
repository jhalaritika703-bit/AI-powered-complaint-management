import { z } from 'zod';
import { CATEGORIES, PRIORITIES, STATUSES } from './constants.js';

// ---------- Request validation ----------

export const createComplaintSchema = z.object({
  customerName: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or fewer'),
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long')
    .pipe(z.email('Enter a valid email address')),
  description: z
    .string({ error: 'Complaint description is required' })
    .trim()
    .min(10, 'Please describe the issue in at least 10 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES, { error: `Status must be one of: ${STATUSES.join(', ')}` }),
});

// Empty query values ("?category=") are treated as "no filter".
const optionalEnum = (values) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.enum(values).optional());

export const listQuerySchema = z.object({
  category: optionalEnum(CATEGORIES),
  priority: optionalEnum(PRIORITIES),
  status: optionalEnum(STATUSES),
});

// ---------- AI response validation ----------
// Gemini output is untrusted: it must pass this schema before it is saved or shown.

export const aiAnalysisSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  priorityReason: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(400),
  suggestedResponse: z.string().trim().min(20).max(2000),
});
