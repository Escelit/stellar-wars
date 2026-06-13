import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from '@/routes/auth';
import narrativeRoutes from '@/routes/narrative';
import savesRoutes from '@/routes/saves';
import playthroughRoutes from '@/routes/playthrough';
import { errorHandler } from '@/middleware/errorHandler';

export const prisma = new PrismaClient();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/narrative', narrativeRoutes);
app.use('/api', savesRoutes);
app.use('/api', playthroughRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

export default app;
