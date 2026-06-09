import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Keypair } from '@stellar/stellar-sdk';
import app, { prisma } from '@/app';
import { signToken } from '@/lib/jwt';

const keypair = Keypair.random();
const publicKey = keypair.publicKey();

beforeAll(async () => {
  await prisma.$connect();
  await prisma.narrativeNode.create({
    data: {
      id: 'test-node-1',
      chapter: 1,
      title: 'Test Node',
      content: 'Test content',
      choices: JSON.stringify([{ text: 'Continue', nextNodeId: 'test-node-2' }]),
    },
  });
  await prisma.narrativeNode.create({
    data: {
      id: 'test-node-2',
      chapter: 1,
      title: 'Test Node 2',
      content: 'Test content 2',
      choices: JSON.stringify([]),
    },
  });
});

afterAll(async () => {
  await prisma.choice.deleteMany();
  await prisma.playthrough.deleteMany();
  await prisma.saveGame.deleteMany();
  await prisma.narrativeNode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /api/auth/challenge', () => {
  it('returns a challenge for a valid public key', async () => {
    const res = await request(app)
      .get('/api/auth/challenge')
      .query({ publicKey });
    expect(res.status).toBe(200);
    expect(res.body.challenge).toBeDefined();
    expect(typeof res.body.challenge).toBe('string');
    expect(res.body.challenge).toContain(publicKey);
  });

  it('returns 400 without publicKey', async () => {
    const res = await request(app).get('/api/auth/challenge');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/connect', () => {
  it('verifies a valid signature and returns a token', async () => {
    const challengeRes = await request(app)
      .get('/api/auth/challenge')
      .query({ publicKey });
    const { challenge } = challengeRes.body;

    const signature = Buffer.from(keypair.sign(Buffer.from(challenge, 'utf-8'))).toString('hex');

    const res = await request(app).post('/api/auth/connect').send({
      publicKey,
      challenge,
      signature,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.stellarPubKey).toBe(publicKey);
  });

  it('rejects an invalid signature', async () => {
    const challengeRes = await request(app)
      .get('/api/auth/challenge')
      .query({ publicKey });
    const { challenge } = challengeRes.body;

    const res = await request(app).post('/api/auth/connect').send({
      publicKey,
      challenge,
      signature: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    });

    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/connect').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user info with a real valid token', async () => {
    const challengeRes = await request(app)
      .get('/api/auth/challenge')
      .query({ publicKey });
    const { challenge } = challengeRes.body;

    const signature = Buffer.from(keypair.sign(Buffer.from(challenge, 'utf-8'))).toString('hex');

    const connectRes = await request(app).post('/api/auth/connect').send({
      publicKey,
      challenge,
      signature,
    });

    const token = connectRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stellarPubKey).toBe(publicKey);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me with pre-generated token', () => {
  it('returns user info with a token generated via signToken', async () => {
    const user = await prisma.user.create({
      data: {
        stellarPubKey: 'G_PREGENERATED_KEY',
        displayName: 'Test User',
      },
    });
    const token = signToken({ userId: user.id, stellarPubKey: user.stellarPubKey });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stellarPubKey).toBe('G_PREGENERATED_KEY');

    await prisma.user.delete({ where: { id: user.id } });
  });
});

describe('Narrative nodes seed', () => {
  it('has seeded narrative nodes from beforeAll', async () => {
    const nodes = await prisma.narrativeNode.findMany();
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });
});
