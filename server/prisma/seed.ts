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
      'The mole is exposed and the intelligence leak is sealed. High Command praises your judgment — but the Crimson Armada\'s coordinated timing was no coincidence. A fleet beacon on the frontier has sent a distress signal bearing the war mark of the Iron Syndicate. The truce is over.',
    choices: [
      {
        text: 'Answer the call and move to the frontier',
        nextNodeId: 'ch3-start',
      },
    ],
  },
  {
    id: 'ch3-start',
    chapter: 3,
    title: 'The Iron Front',
    content:
      'The frontier beacon repeats a single word on an endless loop: INVADERS. The Iron Syndicate has massed a siege fleet at the Carinthia Gate, and the defenseless colony world of Tereth Prime stands in their path. Your task force jumps in ahead of the enemy armada.',
    choices: [
      {
        text: 'Lead a decoy squadron to split their forces',
        nextNodeId: 'ch3-decoy',
      },
      {
        text: 'Set up a defensive net in the asteroid belt',
        nextNodeId: 'ch3-ambush',
      },
      {
        text: 'Attempt to out-negotiate the Syndicate war leaders',
        nextNodeId: 'ch3-negotiate',
      },
    ],
  },
  {
    id: 'ch3-decoy',
    chapter: 3,
    title: 'Bait the Leviathan',
    content:
      'Your decoy squadron leads three Syndicate battlecruisers on a wild chase through the Cormorant Nebula. Their pursuit line stretches thin, exposing their supply haulers to your main fleet. The trap is nearly perfect — but a Syndicate scout has noticed your flagship is missing.',
    choices: [
      {
        text: 'Close the jaws and strike the exposed supply line',
        nextNodeId: 'ch3-breach',
        statGate: { stat: 'strategy', minValue: 70 },
      },
      {
        text: 'Recall the decoy and form a battle line',
        nextNodeId: 'ch3-ambush',
      },
    ],
  },
  {
    id: 'ch3-ambush',
    chapter: 3,
    title: 'Silence Among the Rocks',
    content:
      'Your fleet hides among the tumbling asteroids of the Shatter Field, engines cold, reactor signatures masked. The Syndicate armada drifts past, unaware, escorting a titanic siege platform toward Tereth Prime. It passes within weapons range.',
    choices: [
      {
        text: 'Open fire on the siege platform with everything you have',
        nextNodeId: 'ch3-breach',
        statGate: { stat: 'attack', minValue: 75 },
      },
      {
        text: 'Shadow the platform and wait for the right moment',
        nextNodeId: 'ch3-intercept',
      },
    ],
  },
  {
    id: 'ch3-negotiate',
    chapter: 3,
    title: 'A Parley of Wolves',
    content:
      'The Syndicate warlord, Ghorzul Thane, accepts your transmission. \'You speak well for a federation dog,\' he growls, \'but my bosses want the shipyards of Tereth Prime, and I collect what they want.\' His fleet could be turned — if you can offer something richer than a colony world.',
    choices: [
      {
        text: 'Offer the Syndicate a stake in the void-cult supply routes',
        nextNodeId: 'ch3-breach',
        statGate: { stat: 'influence', minValue: 75 },
      },
      {
        text: 'Bribe the warlord with a capture bounty on the Crimson Armada',
        nextNodeId: 'ch3-intercept',
      },
    ],
  },
  {
    id: 'ch3-intercept',
    chapter: 3,
    title: 'Reposition for Victory',
    content:
      'Patience pays. The Syndicate siege platform lumbers into the gravity well of Tereth Prime, and its escort spreads thin across the orbital lanes. From the planet\'s shadow, your fleet rises like dawn break. The enemy realizes their mistake a heartbeat too late.',
    choices: [
      {
        text: 'Concentrate fire on the escort flagship',
        nextNodeId: 'ch3-breach',
      },
      {
        text: 'Board the siege platform and disable it from within',
        nextNodeId: 'ch3-breach',
        statGate: { stat: 'defense', minValue: 70 },
      },
    ],
  },
  {
    id: 'ch3-breach',
    chapter: 3,
    title: 'The Gates Fall',
    content:
      'The Syndicate line shatters. Ghorzul Thane\'s flagship blossoms into a firestorm of ruptured reactors, and the siege platform lists helplessly, its thruster gondolas venting atmosphere. Tereth Prime is saved. But in the aftermath, your sensors detect a signal buried in the Syndicate\'s debris — a Void Cult distress call with your name attached.',
    choices: [
      {
        text: 'Study the anomaly and follow its source',
        nextNodeId: 'ch4-start',
      },
    ],
  },
  {
    id: 'ch4-start',
    chapter: 4,
    title: 'The Drift of Echoes',
    content:
      'The signal leads you to a derelict Void Cult warship, the Endless Lullaby, drifting in a graveyard of broken cruisers. Its hull is carved with sigils that hum in a frequency that makes your teeth ache. An open hatch breathes cold air into the dark. Something is still alive aboard — or something is waiting.',
    choices: [
      {
        text: 'Lead an away team into the derelict',
        nextNodeId: 'ch4-board',
      },
      {
        text: 'Remote-scan the derelict from your flagship',
        nextNodeId: 'ch4-scan-ship',
      },
      {
        text: 'Set the derelict ablaze from a safe distance',
        nextNodeId: 'ch4-burn',
      },
    ],
  },
  {
    id: 'ch4-board',
    chapter: 4,
    title: 'Echoes in the Dark',
    content:
      'The Endless Lullaby\'s corridors are silent except for the low hum of carved sigils. In the medbay, a single survivor — a Cult navigator — babbles about the "star that swallows souls." The ship\'s log shows it was fleeing something at the edge of the Nova Drift, something the Ikari cartographers have never mapped.',
    choices: [
      {
        text: 'Interrogate the navigator with a neural probe',
        nextNodeId: 'ch4-revelation',
        statGate: { stat: 'strategy', minValue: 65 },
      },
      {
        text: 'Follow the log\'s plotted course to the anomaly',
        nextNodeId: 'ch4-revelation',
      },
    ],
  },
  {
    id: 'ch4-scan-ship',
    chapter: 4,
    title: 'The Dead Listen Back',
    content:
      'A deep-spectrum scan reveals the derelict\'s stern is fused to a structure of pure obsidian star-metal — an object older than any ship in this sector. The scan image shimmers, shifts, and for a single frame a face stares back through the sensor feed. It is your face.',
    choices: [
      {
        text: 'Dismiss it as interference and open the derelict anyway',
        nextNodeId: 'ch4-revelation',
      },
      {
        text: 'Morph the scan and recall the away teams from the perimeter',
        nextNodeId: 'ch4-burn',
      },
    ],
  },
  {
    id: 'ch4-burn',
    chapter: 4,
    title: 'Fire and Silence',
    content:
      'Incinerator beams lance across the derelict\'s hull, and the Endless Lullaby burns with a blue-white purity that feels, somehow, grateful. As the fires die, a beacon activates inside the wreck, broadcasting old Terran distress codes. Whatever was inside wants you to come back — and it has a better reason now.',
    choices: [
      {
        text: 'Retrieve the beacon and follow its source',
        nextNodeId: 'ch4-revelation',
      },
      {
        text: 'Nuke the wreck from orbit and leave the sector',
        nextNodeId: 'ch5-start',
      },
    ],
  },
  {
    id: 'ch4-revelation',
    chapter: 4,
    title: 'The Soul Eater',
    content:
      'The co-ordinates resolve with terrifying clarity. The anomaly is a tear in spacetime — a rift opened by the Collapse War, a hundred years ago. Through it, the Void Cult has been pulling defeated commanders\' minds, hoarding consciousness in a psychic vault beneath the reality membrane. Your fallen enemies are not dead. They are archived. And they want out.',
    choices: [
      {
        text: 'Seal the rift from your side and rally every faction',
        nextNodeId: 'ch5-start',
        statGate: { stat: 'influence', minValue: 75 },
      },
      {
        text: 'Enter the rift alone to free the trapped minds',
        nextNodeId: 'ch4-solo',
        statGate: { stat: 'attack', minValue: 80 },
      },
    ],
  },
  {
    id: 'ch4-solo',
    chapter: 4,
    title: 'The Long Fall',
    content:
      'Inside the rift, time is a liquid and distance is a lie. Millions of voices — soldiers, commanders, conquerors — whisper in the dark, each one a memory that never stopped living. At the center burns a singular consciousness: the first Void Cult oracle, fed on a century of stolen minds. It smiles with your face and speaks.',
    choices: [
      {
        text: 'Fight the oracle head-on and break the vault',
        nextNodeId: 'ch5-start',
      },
      {
        text: 'Merge with the oracle and reclaim the minds by force of will',
        nextNodeId: 'ch5-start',
        statGate: { stat: 'influence', minValue: 85 },
      },
    ],
  },
  {
    id: 'ch5-start',
    chapter: 5,
    title: 'The Throne of Stars',
    content:
      'The rift collapses behind you, but the war has only one ending left to write. Every faction — the Terran Federation, the Solari Empire, the Void Cult, the Iron Syndicate — has converged on the Citadel at Helm\'s End, each believing they will command the rebuilt galaxy. The final throne of the Stellar Alliance is empty, and it will be claimed by force, by treaty, or by fire.',
    choices: [
      {
        text: 'Marshal the loyalist fleet for a full frontal assault',
        nextNodeId: 'ch5-assault',
      },
      {
        text: 'Call for a conclave of all four faction leaders',
        nextNodeId: 'ch5-conclave',
      },
      {
        text: 'Strike at the Citadel\'s heart with a siege breaker squad',
        nextNodeId: 'ch5-siege',
      },
    ],
  },
  {
    id: 'ch5-assault',
    chapter: 5,
    title: 'The Last Stand of the Loyalists',
    content:
      'Your flagship leads the charge through a storm of crossfire. The Citadel\'s defenses are overwhelming, but the loyalist fleet was forged in a hundred hard-won victories. Orbital batteries shatter and the jump lanes to the throne chamber ripple open before you.',
    choices: [
      {
        text: 'Ride the shockwave through the breach',
        nextNodeId: 'ch5-final-battle',
        statGate: { stat: 'attack', minValue: 80 },
      },
      {
        text: 'Hold the line and let the enemy exhaust their fire',
        nextNodeId: 'ch5-final-battle',
      },
    ],
  },
  {
    id: 'ch5-conclave',
    chapter: 5,
    title: 'A Throne Built on Words',
    content:
      'Four faction leaders stand across the mediation table. The Void Cult\'s oracle-weaver slips a memory into the Iron Syndicate\'s warlord, and the Terran Federation marshal squares off against the Solari Empress. One wrong word will collapse the peace before it begins.',
    choices: [
      {
        text: 'Expose the oracle\'s trick to shatter the Cult\'s sway',
        nextNodeId: 'ch5-final-battle',
        statGate: { stat: 'strategy', minValue: 75 },
      },
      {
        text: 'Offer the throne authority to whichever faction refuses war',
        nextNodeId: 'ch5-final-battle',
        statGate: { stat: 'influence', minValue: 80 },
      },
    ],
  },
  {
    id: 'ch5-siege',
    chapter: 5,
    title: 'Sabotage of the Damned',
    content:
      'Your siege breaker squad melts through the Citadel\'s lower decks, planting charges and cutting off the enemy\'s escape routes. In the command vault above, the faction leaders are converging on the Empty Throne. You reach the lift shaft a minute ahead of them all.',
    choices: [
      {
        text: 'Bypass the lock and take the throne before they arrive',
        nextNodeId: 'ch5-final-battle',
      },
      {
        text: 'Rig the vault door to seal on their approach',
        nextNodeId: 'ch5-final-battle',
        statGate: { stat: 'strategy', minValue: 70 },
      },
    ],
  },
  {
    id: 'ch5-final-battle',
    chapter: 5,
    title: 'One Throne, One Fleets of Stars',
    content:
      'The vault doors thunder open and the Empty Throne of the Stellar Alliance blazes with cold fire before you. The four faction leaders enter behind you, weapons drawn and tongues sharpened. Every victory and defeat of your campaign hangs in this single moment. You have one last choice — and it will decide the shape of the galaxy.',
    choices: [
      {
        text: 'Claim the throne for your commander and end the war',
        nextNodeId: 'ch5-ending-claim',
      },
      {
        text: 'Broker a power-sharing pact that ends the arms race',
        nextNodeId: 'ch5-ending-pact',
        statGate: { stat: 'influence', minValue: 80 },
      },
    ],
  },
  {
    id: 'ch5-ending-claim',
    chapter: 5,
    title: 'Epilogue: The Iron Crown',
    content:
      'You sit at last upon the throne of the Stellar Alliance, the weight of a hundred interstellar nations resting on your shoulders. Somewhere in the deep void, a new rift begins to whisper. But that is a story for another campaign.\n\nCONGRATULATIONS, COMMANDER. The war is won — for now.',
    choices: [],
  },
  {
    id: 'ch5-ending-pact',
    chapter: 5,
    title: 'Epilogue: The Accord of Stars',
    content:
      'Through sheer force of will and a hundred whispered promises, you bind the four factions into a lasting peace. The throne remains empty, as all proper thrones should be — a symbol of the alliance above any single warlord. The stars have never known such quiet.\n\nCONGRATULATIONS, COMMANDER. You ended the war without winning it. That is the rarest victory of all.',
    choices: [],
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
