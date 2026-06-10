import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '@/app';
import { signToken } from '@/lib/jwt';

let token: string;
let userId: string;
let playthroughId: string;

beforeAll(async () => {
  await prisma.$connect();

  const user = await prisma.user.create({
    data: {
      stellarPubKey: 'G_NARRATIVE_TEST',
      displayName: 'Narrative Tester',
    },
  });
  userId = user.id;
  token = signToken({ userId: user.id, stellarPubKey: user.stellarPubKey });

  await prisma.narrativeNode.upsert({
    where: { id: 'test-node-1' },
    update: {},
    create: {
      id: 'test-node-1',
      chapter: 1,
      title: 'Test Node 1',
      content: 'This is the first test node.',
      choices: JSON.stringify([{ text: 'Go to node 2', nextNodeId: 'test-node-2' }]),
    },
  });

  await prisma.narrativeNode.upsert({
    where: { id: 'test-node-2' },
    update: {},
    create: {
      id: 'test-node-2',
      chapter: 1,
      title: 'Test Node 2',
      content: 'This is the second test node.',
      choices: JSON.stringify([
        { text: 'Easy route', nextNodeId: 'test-node-1' },
        {
          text: 'Stat-gated route',
          nextNodeId: 'test-node-1',
          statGate: { stat: 'strategy', minValue: 70 },
        },
      ]),
    },
  });

  await prisma.narrativeNode.upsert({
    where: { id: 'test-ch2-node' },
    update: {},
    create: {
      id: 'test-ch2-node',
      chapter: 2,
      title: 'Chapter 2 Node',
      content: 'Welcome to chapter 2.',
      choices: JSON.stringify([]),
    },
  });

  const pt = await prisma.playthrough.create({
    data: {
      userId: user.id,
      currentNode: 'test-node-1',
      chapter: 1,
      isActive: true,
    },
  });
  playthroughId = pt.id;
});

afterAll(async () => {
  await prisma.choice.deleteMany();
  await prisma.saveGame.deleteMany();
  await prisma.playthrough.deleteMany();
  await prisma.narrativeNode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('GET /api/narrative/node/:id', () => {
  it('fetches an existing node', async () => {
    const res = await request(app).get('/api/narrative/node/test-node-1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('test-node-1');
    expect(res.body.title).toBe('Test Node 1');
    expect(res.body.content).toBe('This is the first test node.');
    expect(res.body.chapter).toBe(1);
    expect(Array.isArray(res.body.choices)).toBe(true);
    expect(res.body.choices[0].text).toBe('Go to node 2');
  });

  it('returns 404 for a non-existent node', async () => {
    const res = await request(app).get('/api/narrative/node/non-existent');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/narrative/choose', () => {
  it('rejects without auth', async () => {
    const res = await request(app).post('/api/narrative/choose').send({
      playthroughId,
      choiceIndex: 0,
    });
    expect(res.status).toBe(401);
  });

  it('submits a valid choice and returns next node', async () => {
    const res = await request(app)
      .post('/api/narrative/choose')
      .set('Authorization', `Bearer ${token}`)
      .send({ playthroughId, choiceIndex: 0 });

    expect(res.status).toBe(200);
    expect(res.body.chosenChoice).toBeDefined();
    expect(res.body.chosenChoice.text).toBe('Go to node 2');
    expect(res.body.nextNode).toBeDefined();
    expect(res.body.nextNode.id).toBe('test-node-2');
  });

  it('rejects invalid choiceIndex', async () => {
    const res = await request(app)
      .post('/api/narrative/choose')
      .set('Authorization', `Bearer ${token}`)
      .send({ playthroughId, choiceIndex: 99 });

    expect(res.status).toBe(400);
  });

  it('prevents choosing a stat-gated option when stats are too low', async () => {
    const res = await request(app)
      .post('/api/narrative/choose')
      .set('Authorization', `Bearer ${token}`)
      .send({
        playthroughId,
        choiceIndex: 1,
        commanderStats: { strategy: 30, attack: 50, defense: 50, influence: 50, morale: 80 },
      });

    expect(res.status).toBe(403);
  });

  it('allows a stat-gated choice when stats meet the requirement', async () => {
    const pt = await prisma.playthrough.create({
      data: {
        userId,
        currentNode: 'test-node-2',
        chapter: 1,
        isActive: true,
      },
    });

    const res = await request(app)
      .post('/api/narrative/choose')
      .set('Authorization', `Bearer ${token}`)
      .send({
        playthroughId: pt.id,
        choiceIndex: 1,
        commanderStats: { strategy: 85, attack: 50, defense: 50, influence: 50, morale: 80 },
      });

    expect(res.status).toBe(200);
    expect(res.body.nextNode).toBeDefined();
    expect(res.body.nextNode.id).toBe('test-node-1');
  });
});

describe('GET /api/narrative/choices/:playthroughId', () => {
  it('rejects without auth', async () => {
    const res = await request(app).get(`/api/narrative/choices/${playthroughId}`);
    expect(res.status).toBe(401);
  });

  it('returns choice history for the playthrough', async () => {
    const res = await request(app)
      .get(`/api/narrative/choices/${playthroughId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.playthroughId).toBe(playthroughId);
    expect(Array.isArray(res.body.choices)).toBe(true);
    expect(res.body.choices.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/save', () => {
  it('rejects without auth', async () => {
    const res = await request(app).post('/api/save').send({ playthroughId });
    expect(res.status).toBe(401);
  });

  it('creates a new save', async () => {
    const res = await request(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({ playthroughId, name: 'Test Save', data: '{"chapter":1}' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Save');
    expect(res.body.playthroughId).toBe(playthroughId);
    expect(res.body.data).toBe('{"chapter":1}');
  });

  it('updates an existing save slot', async () => {
    const res = await request(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({ playthroughId, name: 'Test Save', data: '{"chapter":2}' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBe('{"chapter":2}');
  });

  it('returns 400 without playthroughId', async () => {
    const res = await request(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/save/:playthroughId', () => {
  it('rejects without auth', async () => {
    const res = await request(app).get(`/api/save/${playthroughId}`);
    expect(res.status).toBe(401);
  });

  it('loads the most recent save for a playthrough', async () => {
    const res = await request(app)
      .get(`/api/save/${playthroughId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.playthroughId).toBe(playthroughId);
    expect(res.body.data).toBeDefined();
  });
});

describe('GET /api/saves', () => {
  it('rejects without auth', async () => {
    const res = await request(app).get('/api/saves');
    expect(res.status).toBe(401);
  });

  it('lists all saves for the user', async () => {
    const res = await request(app)
      .get('/api/saves')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.saves)).toBe(true);
    expect(res.body.saves.length).toBeGreaterThanOrEqual(1);
    expect(res.body.saves[0].name).toBeDefined();
  });
});
