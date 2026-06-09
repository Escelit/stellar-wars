import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Choice {
  text: string;
  nextNodeId: string;
  statGate?: { stat: string; minValue: number };
}

const narrativeNodes: Array<{
  id: string;
  chapter: number;
  title: string;
  content: string;
  choices: Choice[];
}> = [
  {
    id: 'ch1-start',
    chapter: 1,
    title: 'The Awakening',
    content:
      'The bridge hums with emergency alerts. A fleet of hostile ships has just emerged from the L5 jump gate. As the newly appointed commander of the SSC Vanguard, the sector\u2019s defense rests on your shoulders. Your crew looks to you for orders.',
    choices: [
      {
        text: 'Order an immediate counter-attack',
        nextNodeId: 'ch1-aggressive',
      },
      {
        text: 'Raise defensive shields and assess their formation',
        nextNodeId: 'ch1-defensive',
      },
      {
        text: 'Hail the unidentified fleet and demand identification',
        nextNodeId: 'ch1-diplomatic',
      },
    ],
  },
  {
    id: 'ch1-aggressive',
    chapter: 1,
    title: 'Full Assault',
    content:
      'You launch a volley of torpedoes at the lead ship. The explosion lights up the void, but the enemy fleet scatters and begins a pincer maneuver. Your aggression has drawn first blood, but now you face a coordinated retaliation.',
    choices: [
      {
        text: 'Press the attack — full power to weapons',
        nextNodeId: 'ch1-start',
        statGate: { stat: 'strategy', minValue: 70 },
      },
      {
        text: 'Fall back to the defense platform',
        nextNodeId: 'ch1-start',
      },
    ],
  },
  {
    id: 'ch1-defensive',
    chapter: 1,
    title: 'Fortify Position',
    content:
      'Energy barriers flicker to life around the Vanguard. The enemy fleet adjusts course, attempting to surround the station. Your defensive posture buys precious time for reinforcements to arrive.',
    choices: [
      {
        text: 'Launch a calculated counter-strike while they reposition',
        nextNodeId: 'ch1-start',
        statGate: { stat: 'strategy', minValue: 50 },
      },
      {
        text: 'Hold position and wait for reinforcements',
        nextNodeId: 'ch1-start',
      },
    ],
  },
  {
    id: 'ch1-diplomatic',
    chapter: 1,
    title: 'Open Channel',
    content:
      'A crackling transmission breaks through the static. The voice on the other end identifies themselves as Admiral Vex of the Crimson Armada. They claim this sector was ceded to them in the Treaty of Andromeda. The treaty is a forgery — but calling their bluff could start a war.',
    choices: [
      {
        text: 'Expose the forged treaty and prepare for battle',
        nextNodeId: 'ch1-start',
        statGate: { stat: 'charisma', minValue: 60 },
      },
      {
        text: 'Play along and request a meeting',
        nextNodeId: 'ch1-start',
      },
    ],
  },
  {
    id: 'ch1-victory',
    chapter: 1,
    title: 'Chapter 1 Complete',
    content:
      'The enemy fleet retreats. Your command has held the line. The sector is safe — for now. But whispers of a larger conspiracy begin to surface. Chapter 1 complete.',
    choices: [
      {
        text: 'Proceed to Chapter 2',
        nextNodeId: 'ch2-start',
      },
    ],
  },
  {
    id: 'ch2-start',
    chapter: 2,
    title: 'Shadows of Betrayal',
    content:
      'An urgent message arrives from High Command. Intelligence reports suggest a mole within the sector command. Someone has been feeding information to the Crimson Armada. Trust no one.',
    choices: [
      {
        text: 'Investigate the command staff personally',
        nextNodeId: 'ch1-start',
      },
      {
        text: 'Set a trap with false intelligence',
        nextNodeId: 'ch1-start',
      },
      {
        text: 'Request a full psychic scan of all personnel',
        nextNodeId: 'ch1-start',
        statGate: { stat: 'charisma', minValue: 80 },
      },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  for (const node of narrativeNodes) {
    await prisma.narrativeNode.upsert({
      where: { id: node.id },
      update: {
        chapter: node.chapter,
        title: node.title,
        content: node.content,
        choices: JSON.stringify(node.choices),
      },
      create: {
        id: node.id,
        chapter: node.chapter,
        title: node.title,
        content: node.content,
        choices: JSON.stringify(node.choices),
      },
    });
  }

  console.log(`Seeded ${narrativeNodes.length} narrative nodes`);
  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
