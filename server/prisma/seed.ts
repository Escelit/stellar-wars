import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Choice {
  text: string;
  nextNodeId: string;
  statGate?: { stat: string; minValue: number };
}

const VALID_STATS = ['attack', 'defense', 'strategy', 'influence', 'morale'];

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
        nextNodeId: 'ch1-victory',
        statGate: { stat: 'strategy', minValue: 70 },
      },
      {
        text: 'Fall back to the defense platform',
        nextNodeId: 'ch1-defensive',
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
        nextNodeId: 'ch1-victory',
        statGate: { stat: 'strategy', minValue: 50 },
      },
      {
        text: 'Hold position and await the reinforcement fleet',
        nextNodeId: 'ch1-victory',
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
        nextNodeId: 'ch1-victory',
        statGate: { stat: 'influence', minValue: 60 },
      },
      {
        text: 'Play along and request a meeting',
        nextNodeId: 'ch1-victory',
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
        nextNodeId: 'ch2-investigate',
      },
      {
        text: 'Set a trap with false intelligence',
        nextNodeId: 'ch2-trap',
      },
      {
        text: 'Request a full psychic scan of all personnel',
        nextNodeId: 'ch2-scan',
      },
    ],
  },
  {
    id: 'ch2-investigate',
    chapter: 2,
    title: 'Brush with the Fifth Column',
    content:
      'Your quiet review of the command staff turns up a logistics officer whose travel pattern never quite aligns with their duty roster. Every convoy they touched was later ambushed. The evidence is circumstantial — but damning.',
    choices: [
      {
        text: 'Confront them with your evidence in private',
        nextNodeId: 'ch2-victory',
        statGate: { stat: 'influence', minValue: 70 },
      },
      {
        text: 'Plant a listening device and observe',
        nextNodeId: 'ch2-victory',
      },
    ],
  },
  {
    id: 'ch2-trap',
    chapter: 2,
    title: 'Bait the Mole',
    content:
      'You broadcast false coordinates for the next supply convoy. Within the hour, the encoded routing data has been downloaded from the command terminal exactly once, by a ghost account that exists only on paper.',
    choices: [
      {
        text: 'Kindle the trap and catch the courier red-handed',
        nextNodeId: 'ch2-victory',
        statGate: { stat: 'strategy', minValue: 70 },
      },
      {
        text: 'Wait and see who moves to intercept the convoy',
        nextNodeId: 'ch2-victory',
      },
    ],
  },
  {
    id: 'ch2-scan',
    chapter: 2,
    title: 'Psychic Sweep',
    content:
      'The psychic scan completes. One officer carries a latent mind-link signature to the Crimson Armada — likely implanted without their knowledge. Purge it, and you may gain a valuable double agent. Fail, and you tip the mole off.',
    choices: [
      {
        text: 'Sanction a surgical mind-purge',
        nextNodeId: 'ch2-victory',
        statGate: { stat: 'influence', minValue: 80 },
      },
      {
        text: 'Lock them in a deep-frost cell while you decide',
        nextNodeId: 'ch2-victory',
      },
    ],
  },
  {
    id: 'ch2-victory',
    chapter: 2,
    title: 'The Conspirator Exposed',
    content:
      'The mole is exposed and the intelligence leak is sealed. High Command praises your judgment — but the Crimson Armada\'s coordinated timing was no coincidence. Somewhere above you, a larger betrayal is taking shape. The campaign continues.',
    choices: [
      {
        text: 'Return to your flagship to await further orders',
        nextNodeId: 'ch1-start',
      },
    ],
  },
];

function validateGraph(nodes: typeof narrativeNodes) {
  const ids = new Set(nodes.map((n) => n.id));
  const errors: string[] = [];

  for (const node of nodes) {
    for (const choice of node.choices) {
      if (!ids.has(choice.nextNodeId)) {
        errors.push(
          `Node '${node.id}' choice "${choice.text}" references unknown node '${choice.nextNodeId}'`
        );
      }
      if (choice.statGate && !VALID_STATS.includes(choice.statGate.stat)) {
        errors.push(
          `Node '${node.id}' choice "${choice.text}" uses unknown stat '${choice.statGate.stat}'`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Narrative graph validation failed:\n${errors.join('\n')}`);
  }
}

async function main() {
  console.log('Seeding database...');
  validateGraph(narrativeNodes);

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
