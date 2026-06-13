import { Router } from 'express';
import { prisma } from '@/app';
import { requireAuth } from '@/middleware/auth';
import { AppError, asyncHandler } from '@/middleware/errorHandler';

const router = Router();

router.post(
  '/playthrough',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { commanderId, startingNodeId } = req.body as {
      commanderId?: string;
      startingNodeId?: string;
    };

    const startNodeId = startingNodeId || 'ch1-start';

    const startNode = await prisma.narrativeNode.findUnique({
      where: { id: startNodeId },
    });

    if (!startNode) {
      throw new AppError(404, `Starting node '${startNodeId}' not found`);
    }

    const playthrough = await prisma.playthrough.create({
      data: {
        userId: req.user!.userId,
        commanderId: commanderId || null,
        currentNode: startNodeId,
        chapter: startNode.chapter,
      },
    });

    res.json({
      id: playthrough.id,
      chapter: playthrough.chapter,
      currentNode: playthrough.currentNode,
      createdAt: playthrough.createdAt.toISOString(),
    });
  })
);

router.get(
  '/playthroughs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const playthroughs = await prisma.playthrough.findMany({
      where: { userId: req.user!.userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        chapter: true,
        currentNode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      playthroughs: playthroughs.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  })
);

export default router;
