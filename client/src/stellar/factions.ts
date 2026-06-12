export interface Faction {
  id: string;
  name: string;
  description: string;
  statBonus: number[];
  color: string;
  borderColor: string;
  badgeColor: string;
  icon: string;
}

export const STAT_LABELS = ['Attack', 'Defense', 'Strategy', 'Influence', 'Morale'] as const;
export const STAT_COUNT = 5;
export const MAX_STAT = 100;

export type StatName = (typeof STAT_LABELS)[number];

export const FACTIONS: Faction[] = [
  {
    id: 'terran-federation',
    name: 'Terran Federation',
    description: 'Elite defenders with unbreakable morale. Masters of fortified warfare.',
    statBonus: [1, 4],
    color: '#3b82f6',
    borderColor: 'border-blue-500',
    badgeColor: 'bg-blue-600',
    icon: '🛡️',
  },
  {
    id: 'solari-empire',
    name: 'Solari Empire',
    description: 'Brilliant strategists and diplomats who win wars before they begin.',
    statBonus: [2, 3],
    color: '#f59e0b',
    borderColor: 'border-amber-500',
    badgeColor: 'bg-amber-600',
    icon: '👁️',
  },
  {
    id: 'void-cult',
    name: 'Void Cult',
    description: 'Relentless attackers who strike from the shadows with precision.',
    statBonus: [0, 2],
    color: '#a855f7',
    borderColor: 'border-purple-500',
    badgeColor: 'bg-purple-600',
    icon: '🌑',
  },
  {
    id: 'iron-syndicate',
    name: 'Iron Syndicate',
    description: 'Merciless industrial war machine built on raw power and endurance.',
    statBonus: [0, 1],
    color: '#ef4444',
    borderColor: 'border-red-500',
    badgeColor: 'bg-red-600',
    icon: '⚙️',
  },
];

export function generateStats(factionId: string): number[] {
  const faction = FACTIONS.find((f) => f.id === factionId);
  const stats: number[] = [];

  for (let i = 0; i < STAT_COUNT; i++) {
    let base = 40 + Math.floor(Math.random() * 31);
    if (faction && faction.statBonus.includes(i)) {
      base += 15;
    }
    stats.push(Math.min(base, MAX_STAT));
  }

  return stats;
}

export function determineRarity(stats: number[]): number {
  const total = stats.reduce((a, b) => a + b, 0);
  if (total >= 420) return 4;
  if (total >= 370) return 3;
  if (total >= 310) return 2;
  if (total >= 250) return 1;
  return 0;
}

export const RARITY_LABELS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
export const RARITY_COLORS = [
  'text-stellar-400',
  'text-green-400',
  'text-blue-400',
  'text-purple-400',
  'text-yellow-400',
];

export function getFaction(id: string): Faction | undefined {
  return FACTIONS.find((f) => f.id === id);
}
