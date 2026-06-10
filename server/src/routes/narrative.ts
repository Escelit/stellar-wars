import { Router } from 'express';
import { prisma } from '@/app';
import { requireAuth } from '@/middleware/auth';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import type { Choice, ChooseBody } from '@/types/narrative';

const router = Router();

/**
 * GET /api/narrative/node/:id
 *
 * Fetch a story node by its string ID.
 * Returns the node with its choices parsed from JSON.
 *
 * Example: GET /api/narrative/node/ch1-start
 */
router.get(
  '/node/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const node = await prisma.narrativeNode.findUnique({ where: { id } });

    if (!node) {
      throw new AppError(404, `Narrative node '${id}' not found`);
    }

    const choices: Choice[] = JSON.parse(node.choices);

    res.json({
      id: node.id,
      chapter: node.chapter,
      title: node.title,
      content: node.content,
      choices,
      createdAt: node.createdAt.toISOString(),
    });
  })
);

/**
 * POST /api/narrative/choose
 *
 * Submit a choice for a playthrough.
 * Validates stat gates against provided commander stats if present.
 * Records the choice, advances the playthrough, and returns the next node.
 *
 * Auth: Bearer token required
 * Body: { playthroughId, choiceIndex, commanderStats? }
 *
 * Example: POST /api/narrative/choose
 *   { "playthroughId": "...", "choiceIndex": 0, "commanderStats": { "strategy": 75, ... } }
 */
router.post(
  '/choose',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { playthroughId, choiceIndex, commanderStats } = req.body as ChooseBody;

    if (!playthroughId || choiceIndex === undefined || choiceIndex === null) {
      throw new AppError(400, 'playthroughId and choiceIndex are required');
    }

    const playthrough = await prisma.playthrough.findUnique({
      where: { id: playthroughId },
      include: { current: true },
    });

    if (!playthrough) {
      throw new AppError(404, 'Playthrough not found');
    }

    if (playthrough.userId !== req.user!.userId) {
      throw new AppError(403, 'You do not own this playthrough');
    }

    if (!playthrough.isActive) {
      throw new AppError(400, 'This playthrough is no longer active');
    }

    if (!playthrough.currentNode) {
      throw new AppError(400, 'No current node set for this playthrough');
    }

    const currentNode = playthrough.current;
    if (!currentNode) {
      throw new AppError(404, 'Current narrative node not found');
    }

    const choices: Choice[] = JSON.parse(currentNode.choices);

    if (choiceIndex < 0 || choiceIndex >= choices.length) {
      throw new AppError(400, `Invalid choiceIndex. Must be 0-${choices.length - 1}`);
    }

    const chosenChoice = choices[choiceIndex]!;

    if (chosenChoice.statGate && commanderStats) {
      const statKey = chosenChoice.statGate.stat as keyof typeof commanderStats;
      const statValue = commanderStats[statKey];
      const minValue = chosenChoice.statGate.minValue;

      if (statValue < minValue) {
        throw new AppError(
          403,
          `Stat gate not met: ${chosenChoice.statGate.stat} (${statValue}) < required ${minValue}`
        );
      }
    }

    await prisma.choice.create({
      data: {
        playthroughId,
        nodeId: currentNode.id,
        choiceIndex,
      },
    });

    const nextNode = await prisma.narrativeNode.findUnique({
      where: { id: chosenChoice.nextNodeId },
    });

    if (!nextNode) {
      throw new AppError(404, `Next node '${chosenChoice.nextNodeId}' not found`);
    }

    await prisma.playthrough.update({
      where: { id: playthroughId },
      data: {
        currentNode: nextNode.id,
        chapter: nextNode.chapter,
      },
    });

    const nextChoices: Choice[] = JSON.parse(nextNode.choices);

    res.json({
      chosenChoice,
      nextNode: {
        id: nextNode.id,
        chapter: nextNode.chapter,
        title: nextNode.title,
        content: nextNode.content,
        choices: nextChoices,
        createdAt: nextNode.createdAt.toISOString(),
      },
    });
  })
);

/**
 * GET /api/narrative/choices/:playthroughId
 *
 * Fetch the full choice history for a playthrough.
 * Returns ordered list of choices with associated node titles.
 *
 * Auth: Bearer token required
 *
 * Example: GET /api/narrative/choices/clx...
 */
router.get(
  '/choices/:playthroughId',
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

    const choices = await prisma.choice.findMany({
      where: { playthroughId },
      orderBy: { chosenAt: 'asc' },
      include: {
        playthrough: {
          select: {
            current: {
              select: { title: true },
            },
          },
        },
      },
    });

    const results = await Promise.all(
      choices.map(async (choice) => {
        const node = await prisma.narrativeNode.findUnique({
          where: { id: choice.nodeId },
          select: { title: true, chapter: true },
        });
        return {
          id: choice.id,
          choiceIndex: choice.choiceIndex,
          nodeId: choice.nodeId,
          nodeTitle: node?.title ?? null,
          nodeChapter: node?.chapter ?? null,
          chosenAt: choice.chosenAt.toISOString(),
        };
      })
    );

    res.json({
      playthroughId,
      choices: results,
    });
  })
);

export default router;
