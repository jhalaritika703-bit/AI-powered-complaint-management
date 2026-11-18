import express from 'express';
import cors from 'cors';
import complaintRoutes from './routes/complaints.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/complaints', complaintRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
