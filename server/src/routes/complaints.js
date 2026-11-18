import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateObjectId } from '../middleware/errorHandler.js';
import {
  createComplaint,
  getComplaint,
  getStats,
  listComplaints,
  reanalyzeComplaint,
  updateStatus,
} from '../controllers/complaintController.js';

const router = Router();

// Protects the free Gemini quota from spam.
const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please wait a minute and try again.' } },
});

router.param('id', validateObjectId);

router.post('/', aiLimiter, createComplaint);
router.get('/', listComplaints);
router.get('/stats', getStats); // must stay above '/:id'
router.get('/:id', getComplaint);
router.patch('/:id/status', updateStatus);
router.post('/:id/reanalyze', aiLimiter, reanalyzeComplaint);

export default router;
