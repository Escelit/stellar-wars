import { Router } from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { PrismaClient } from '@prisma/client';
import { getChallenge, signToken } from '@/lib/jwt';
import { requireAuth } from '@/middleware/auth';
import { AppError, asyncHandler } from '@/middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of challengeStore) {
    if (value.expiresAt < now) {
      challengeStore.delete(key);
    }
  }
}, 60_000);

router.get(
  '/challenge',
  asyncHandler((req, res) => {
    const publicKey = req.query.publicKey as string;
    if (!publicKey) {
      throw new AppError(400, 'publicKey query parameter is required');
    }

    const challenge = getChallenge(publicKey);
    challengeStore.set(publicKey, { challenge, expiresAt: Date.now() + 300_000 });

    res.json({ challenge });
  })
);

router.post(
  '/connect',
  asyncHandler(async (req, res) => {
    const { publicKey, challenge, signature } = req.body as {
      publicKey?: string;
      challenge?: string;
      signature?: string;
    };

    if (!publicKey || !challenge || !signature) {
      throw new AppError(400, 'publicKey, challenge, and signature are required');
    }

    const stored = challengeStore.get(publicKey);
    if (!stored || stored.challenge !== challenge) {
      throw new AppError(401, 'Invalid challenge');
    }
    if (stored.expiresAt < Date.now()) {
      challengeStore.delete(publicKey);
      throw new AppError(401, 'Challenge expired');
    }
    challengeStore.delete(publicKey);

    let isValid: boolean;
    try {
      const keypair = Keypair.fromPublicKey(publicKey);
      isValid = keypair.verify(
        Buffer.from(challenge, 'utf-8'),
        Buffer.from(signature, 'hex')
      );
    } catch {
      throw new AppError(401, 'Signature verification failed');
    }

    if (!isValid) {
      throw new AppError(401, 'Invalid signature');
    }

    let user = await prisma.user.findUnique({ where: { stellarPubKey: publicKey } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          stellarPubKey: publicKey,
          displayName: `Commander ${publicKey.slice(0, 4)}`,
        },
      });
    }

    const token = signToken({ userId: user.id, stellarPubKey: user.stellarPubKey });

    res.json({
      token,
      user: {
        id: user.id,
        stellarPubKey: user.stellarPubKey,
        displayName: user.displayName,
      },
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      id: user.id,
      stellarPubKey: user.stellarPubKey,
      displayName: user.displayName,
      createdAt: user.createdAt,
    });
  })
);

export default router;
