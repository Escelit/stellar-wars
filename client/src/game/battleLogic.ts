import { BattleStrategy } from '@/stellar/contracts';

export interface BattlePower {
  attack: number;
  defense: number;
  strategy: number;
  influence: number;
}

export interface BattleFighter {
  name: string;
  stats: number[];
  faction: string;
}

export interface BattleResult {
  victory: boolean;
  powerDelta: number;
}

export const STRATEGY_LABELS: Record<BattleStrategy, string> = {
  [BattleStrategy.Aggressive]: 'Aggressive',
  [BattleStrategy.Defensive]: 'Defensive',
  [BattleStrategy.Balanced]: 'Balanced',
  [BattleStrategy.Guerilla]: 'Guerilla',
  [BattleStrategy.Diplomatic]: 'Diplomatic',
};

export const STRATEGY_DESCRIPTIONS: Record<BattleStrategy, string> = {
  [BattleStrategy.Aggressive]: 'Go all-in on offense. High risk, high reward.',
  [BattleStrategy.Defensive]: 'Fortify and endure, waiting for the enemy to break.',
  [BattleStrategy.Balanced]: 'A measured approach that trades blows evenly.',
  [BattleStrategy.Guerilla]: 'Hit-and-run tactics and ambushes to exploit weak points.',
  [BattleStrategy.Diplomatic]: 'Seek to end the battle through negotiation and leverage.',
};

export const OPPONENT_POOL = [
  { name: 'Xenon Warlord', faction: 'void-cult' },
  { name: 'Nova Empress', faction: 'solari-empire' },
  { name: 'Grim Reaver', faction: 'iron-syndicate' },
  { name: 'Kael Starbreaker', faction: 'void-cult' },
  { name: 'Seraphina Blade', faction: 'terran-federation' },
  { name: 'Dread Commander Voss', faction: 'iron-syndicate' },
  { name: 'Admiral Tzeva', faction: 'solari-empire' },
  { name: 'Colonel Ashvane', faction: 'terran-federation' },
];

export function toPower(stats: number[]): BattlePower {
  return {
    attack: stats[0] ?? 0,
    defense: stats[1] ?? 0,
    strategy: stats[2] ?? 0,
    influence: stats[3] ?? 0,
  };
}

export function totalPower(power: BattlePower): number {
  return power.attack + power.defense + power.strategy + power.influence;
}

export function applyStrategy(power: BattlePower, strategy: BattleStrategy): BattlePower {
  switch (strategy) {
    case BattleStrategy.Aggressive:
      return {
        ...power,
        attack: power.attack + 10,
        defense: Math.max(0, power.defense - 8),
      };
    case BattleStrategy.Defensive:
      return {
        ...power,
        attack: Math.max(0, power.attack - 8),
        defense: power.defense + 10,
      };
    case BattleStrategy.Balanced:
      return { ...power };
    case BattleStrategy.Guerilla:
      return {
        ...power,
        attack: power.attack + 6,
        strategy: power.strategy + 6,
        defense: Math.max(0, power.defense - 4),
      };
    case BattleStrategy.Diplomatic:
      return {
        ...power,
        influence: power.influence + 12,
        attack: Math.max(0, power.attack - 4),
      };
  }
}

export function calculateWinProbability(
  playerPower: BattlePower,
  opponentPower: BattlePower,
  strategy: BattleStrategy,
  playerMorale: number,
  opponentMorale: number
): number {
  const adjustedPlayer = applyStrategy(playerPower, strategy);
  const playerTotal = totalPower(adjustedPlayer) + playerMorale * 0.3;
  const opponentTotal = totalPower(opponentPower) + opponentMorale * 0.3;

  const raw = 0.5 + (playerTotal - opponentTotal) / 800;
  return Math.min(0.95, Math.max(0.05, raw));
}

export function resolveBattle(
  player: BattleFighter,
  opponent: BattleFighter,
  strategy: BattleStrategy,
  random: () => number = Math.random
): BattleResult {
  const playerMorale = player.stats[4] ?? 80;
  const opponentMorale = opponent.stats[4] ?? 80;

  const winProbability = calculateWinProbability(
    toPower(player.stats),
    toPower(opponent.stats),
    strategy,
    playerMorale,
    opponentMorale
  );

  const roll = random();
  const victory = roll < winProbability;

  const playerTotal = totalPower(toPower(player.stats));
  const opponentTotal = totalPower(toPower(opponent.stats));
  const powerDelta = playerTotal - opponentTotal;

  return { victory, powerDelta };
}

export function generateOpponent(difficulty: number, random: () => number = Math.random): BattleFighter {
  const poolEntry = OPPONENT_POOL[Math.floor(random() * OPPONENT_POOL.length)]!;

  const stats: number[] = [];
  for (let i = 0; i < 5; i++) {
    const base = 40 + difficulty * 8;
    const variance = Math.floor(random() * 25);
    stats.push(Math.min(100, Math.max(20, base + variance)));
  }

  return {
    name: poolEntry.name,
    faction: poolEntry.faction,
    stats,
  };
}