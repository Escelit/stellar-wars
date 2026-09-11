import { describe, it, expect } from 'vitest';
import { BattleStrategy } from '@/stellar/contracts';
import {
  toPower,
  totalPower,
  applyStrategy,
  calculateWinProbability,
  resolveBattle,
  generateOpponent,
  STRATEGY_LABELS,
  STRATEGY_DESCRIPTIONS,
  OPPONENT_POOL,
} from '../../game/battleLogic';

const baseStats = [80, 70, 60, 50, 90];
const weakStats = [40, 40, 40, 40, 40];
const strongStats = [95, 95, 95, 95, 95];
const evenStats = [70, 70, 70, 70, 70];

describe('battleLogics', () => {
  describe('toPower', () => {
    it('maps the first four stats to battle power', () => {
      const power = toPower([80, 70, 60, 50, 90]);
      expect(power).toEqual({ attack: 80, defense: 70, strategy: 60, influence: 50 });
    });

    it('treats missing stats as zero', () => {
      const power = toPower([80, 70]);
      expect(power).toEqual({ attack: 80, defense: 70, strategy: 0, influence: 0 });
    });
  });

  describe('totalPower', () => {
    it('sums all four power attributes', () => {
      expect(totalPower({ attack: 80, defense: 70, strategy: 60, influence: 50 })).toBe(260);
    });
  });

  describe('applyStrategy', () => {
    it('Aggressive boosts attack and reduces defense', () => {
      const result = applyStrategy({ attack: 50, defense: 50, strategy: 50, influence: 50 }, BattleStrategy.Aggressive);
      expect(result.attack).toBe(60);
      expect(result.defense).toBe(42);
    });

    it('Defensive boosts defense and reduces attack', () => {
      const result = applyStrategy({ attack: 50, defense: 50, strategy: 50, influence: 50 }, BattleStrategy.Defensive);
      expect(result.attack).toBe(42);
      expect(result.defense).toBe(60);
    });

    it('Balanced leaves power unchanged', () => {
      const power = { attack: 50, defense: 50, strategy: 50, influence: 50 };
      expect(applyStrategy(power, BattleStrategy.Balanced)).toEqual(power);
    });

    it('Guerilla boosts attack and strategy, reduces defense', () => {
      const result = applyStrategy({ attack: 50, defense: 50, strategy: 50, influence: 50 }, BattleStrategy.Guerilla);
      expect(result.attack).toBe(56);
      expect(result.strategy).toBe(56);
      expect(result.defense).toBe(46);
    });

    it('Diplomatic boosts influence and reduces attack', () => {
      const result = applyStrategy({ attack: 50, defense: 50, strategy: 50, influence: 50 }, BattleStrategy.Diplomatic);
      expect(result.influence).toBe(62);
      expect(result.attack).toBe(46);
    });
  });

  describe('calculateWinProbability', () => {
    it('returns high probability for a dominant player', () => {
      const p = toPower(strongStats);
      const o = toPower(weakStats);
      const prob = calculateWinProbability(p, o, BattleStrategy.Balanced, 90, 40);
      expect(prob).toBeGreaterThan(0.75);
    });

    it('returns low probability for an outmatched player', () => {
      const p = toPower(weakStats);
      const o = toPower(strongStats);
      const prob = calculateWinProbability(p, o, BattleStrategy.Balanced, 40, 90);
      expect(prob).toBeLessThan(0.25);
    });

    it('returns near 50% for evenly matched forces', () => {
      const p = toPower(evenStats);
      const o = toPower(evenStats);
      const prob = calculateWinProbability(p, o, BattleStrategy.Balanced, 80, 80);
      expect(prob).toBeCloseTo(0.5, 1);
    });

    it('clamps probability between 5% and 95%', () => {
      const extremePlayer = { attack: 100, defense: 100, strategy: 100, influence: 100 };
      const extremeOpponent = { attack: 1, defense: 1, strategy: 1, influence: 1 };
      expect(calculateWinProbability(extremePlayer, extremeOpponent, BattleStrategy.Balanced, 100, 1)).toBeLessThanOrEqual(0.95);

      expect(calculateWinProbability(extremeOpponent, extremePlayer, BattleStrategy.Balanced, 1, 100)).toBeGreaterThanOrEqual(0.05);
    });
  });

  describe('resolveBattle', () => {
    it('returns victory when the random roll favors the player', () => {
      const result = resolveBattle(
        { name: 'Hero', faction: 'terran-federation', stats: baseStats },
        { name: 'Villain', faction: 'void-cult', stats: baseStats },
        BattleStrategy.Balanced,
        () => 0.01
      );
      expect(result.victory).toBe(true);
    });

    it('returns defeat when the random roll is unfavorable', () => {
      const result = resolveBattle(
        { name: 'Hero', faction: 'terran-federation', stats: baseStats },
        { name: 'Villain', faction: 'void-cult', stats: baseStats },
        BattleStrategy.Balanced,
        () => 0.99
      );
      expect(result.victory).toBe(false);
    });

    it('computes a power delta based on raw stats', () => {
      const result = resolveBattle(
        { name: 'Hero', faction: 'terran-federation', stats: strongStats },
        { name: 'Villain', faction: 'void-cult', stats: weakStats },
        BattleStrategy.Balanced,
        () => 0.5
      );
      expect(result.powerDelta).toBeGreaterThan(0);
    });
  });

  describe('generateOpponent', () => {
    it('produces an opponent with a known pool name', () => {
      const opponent = generateOpponent(3, () => 0);
      expect(OPPONENT_POOL.some((o) => o.name === opponent.name)).toBe(true);
    });

    it('scales stats with difficulty', () => {
      const easy = generateOpponent(1, () => 0.9);
      const brutal = generateOpponent(7, () => 0.9);
      const easyTotal = easy.stats.reduce((a, b) => a + b, 0);
      const brutalTotal = brutal.stats.reduce((a, b) => a + b, 0);
      expect(brutalTotal).toBeGreaterThan(easyTotal);
    });

    it('keeps stat values within the 20-100 range', () => {
      const opponent = generateOpponent(7, () => 0);
      for (const stat of opponent.stats) {
        expect(stat).toBeGreaterThanOrEqual(20);
        expect(stat).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('strategy metadata', () => {
    it('labels all five strategies', () => {
      expect(Object.keys(STRATEGY_LABELS)).toHaveLength(5);
      expect(STRATEGY_LABELS[BattleStrategy.Guerilla]).toBe('Guerilla');
    });

    it('describes all five strategies', () => {
      expect(Object.keys(STRATEGY_DESCRIPTIONS)).toHaveLength(5);
      for (const description of Object.values(STRATEGY_DESCRIPTIONS)) {
        expect(description.length).toBeGreaterThan(10);
      }
    });
  });
});