import { Router } from 'express';
import { prisma } from '@/app';
import { requireAuth } from '@/middleware/auth';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import type { SaveBody } from '@/types/narrative';

const router = Router();

/**
 * POST /api/save
 *
 * Save or update game state for a playthrough.
 * Creates a new save entry or updates an existing one by user + name.
 *
 * Auth: Bearer token required
 * Body: { playthroughId, name?, data? }
 *
 * Example: POST /api/save
 *   { "playthroughId": "...", "name": "Slot 1", "data": "{\"chapter\":1,\"score\":100}" }
 */
router.post(
  '/save',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { playthroughId, name, data } = req.body as SaveBody;

    if (!playthroughId) {
      throw new AppError(400, 'playthroughId is required');
    }

    const playthrough = await prisma.playthrough.findUnique({
      where: { id: playthroughId },
    });

    if (!playthrough) {
      throw new AppError(404, 'Playthrough not found');
    }

    if (playthrough.userId !== req.user!.userId) {
      throw new AppError(403, 'You do not own this playthrough');
    }

    const saveName = name ?? 'Slot 1';
    const saveData = data ?? JSON.stringify({
      playthroughId,
      currentNode: playthrough.currentNode,
      chapter: playthrough.chapter,
    });

    const existing = await prisma.saveGame.findUnique({
      where: { userId_name: { userId: req.user!.userId, name: saveName } },
    });

    let save;
    if (existing) {
      save = await prisma.saveGame.update({
        where: { id: existing.id },
        data: {
          playthroughId,
          data: saveData,
        },
      });
    } else {
      save = await prisma.saveGame.create({
        data: {
          userId: req.user!.userId,
          name: saveName,
          playthroughId,
          data: saveData,
        },
      });
    }

    res.json({
      id: save.id,
      name: save.name,
      playthroughId: save.playthroughId,
      data: save.data,
      createdAt: save.createdAt.toISOString(),
      updatedAt: save.updatedAt.toISOString(),
    });
  })
);

/**
 * GET /api/save/:playthroughId
 *
 * Load the most recent saved game state for a playthrough.
 *
 * Auth: Bearer token required
 *
 * Example: GET /api/save/clx...
 */
router.get(
  '/save/:playthroughId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { playthroughId } = req.params;

    const playthrough = await prisma.playthrough.findUnique({
      where: { id: playthroughId },
    });

    if (!playthrough) {
      throw new AppError(404, 'Playthrough not found');
    }

    if (playthrough.userId !== req.user!.userId) {
      throw new AppError(403, 'You do not own this playthrough');
    }

    const save = await prisma.saveGame.findFirst({
      where: { playthroughId, userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!save) {
      throw new AppError(404, 'No save found for this playthrough');
    }

    res.json({
      id: save.id,
      name: save.name,
      playthroughId: save.playthroughId,
      data: save.data,
      createdAt: save.createdAt.toISOString(),
      updatedAt: save.updatedAt.toISOString(),
    });
  })
);

/**
 * GET /api/saves
 *
 * List all save slots for the authenticated user.
 *
 * Auth: Bearer token required
 *
 * Example: GET /api/saves
 */
router.get(
  '/saves',
  requireAuth,
  asyncHandler(async (req, res) => {
    const saves = await prisma.saveGame.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        playthroughId: true,
        updatedAt: true,
      },
    });

    res.json({
      saves: saves.map((s) => ({
        id: s.id,
        name: s.name,
        playthroughId: s.playthroughId,
        updatedAt: s.updatedAt.toISOString(),
      })),
    });
  })
);

export default router;
