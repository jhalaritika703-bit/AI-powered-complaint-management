import Complaint from '../models/Complaint.js';
import { analyzeComplaint } from '../services/gemini.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { createComplaintSchema, listQuerySchema, updateStatusSchema } from '../validators.js';

// POST /api/complaints
export const createComplaint = asyncHandler(async (req, res) => {
  const data = createComplaintSchema.parse(req.body);
  const complaint = new Complaint({ ...data, statusHistory: [{ status: 'Pending' }] });

  // A failed AI call must never lose the customer's complaint: save it and flag it for retry.
  try {
    complaint.analysis = await analyzeComplaint(data);
    complaint.aiStatus = 'success';
  } catch (err) {
    console.error(err.message);
    complaint.aiStatus = 'failed';
    complaint.aiError = err.message.slice(0, 300);
  }

  await complaint.save();
  res.status(201).json({ complaint });
});

// GET /api/complaints?category=&priority=&status=
export const listComplaints = asyncHandler(async (req, res) => {
  const { category, priority, status } = listQuerySchema.parse(req.query);

  const filter = {};
  if (category) filter['analysis.category'] = category;
  if (priority) filter['analysis.priority'] = priority;
  if (status) filter.status = status;

  const complaints = await Complaint.find(filter)
    .select('customerName email status aiStatus createdAt analysis.category analysis.priority analysis.summary')
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ complaints });
});

// GET /api/complaints/stats
export const getStats = asyncHandler(async (_req, res) => {
  const [total, pending, inProgress, resolved, urgentOpen] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'Pending' }),
    Complaint.countDocuments({ status: 'In Progress' }),
    Complaint.countDocuments({ status: 'Resolved' }),
    Complaint.countDocuments({ 'analysis.priority': 'High', status: { $ne: 'Resolved' } }),
  ]);
  res.json({ stats: { total, pending, inProgress, resolved, urgentOpen } });
});

// GET /api/complaints/:id
export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError(404, 'Complaint not found');
  res.json({ complaint });
});

// PATCH /api/complaints/:id/status
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = updateStatusSchema.parse(req.body);

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError(404, 'Complaint not found');

  if (complaint.status !== status) {
    complaint.status = status;
    complaint.statusHistory.push({ status });
    await complaint.save();
  }
  res.json({ complaint });
});

// POST /api/complaints/:id/reanalyze
export const reanalyzeComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError(404, 'Complaint not found');

  try {
    complaint.analysis = await analyzeComplaint(complaint);
    complaint.aiStatus = 'success';
  } catch (err) {
    console.error(err.message);
    throw new AppError(502, 'AI analysis is unavailable right now. Please try again in a minute.');
  }

  await complaint.save();
  res.json({ complaint });
});
