import { describe, it, expect } from 'vitest';
import {
  FACTIONS,
  generateStats,
  determineRarity,
  getFaction,
  RARITY_LABELS,
  STAT_COUNT,
  MAX_STAT,
} from '../factions';

describe('factions', () => {
  describe('FACTIONS', () => {
    it('defines four playable factions', () => {
      expect(FACTIONS).toHaveLength(4);
      const ids = FACTIONS.map((f) => f.id);
      expect(ids).toContain('terran-federation');
      expect(ids).toContain('solari-empire');
      expect(ids).toContain('void-cult');
      expect(ids).toContain('iron-syndicate');
    });

    it('gives every faction an icon, colors, and description', () => {
      for (const faction of FACTIONS) {
        expect(faction.icon).toBeTruthy();
        expect(faction.description.length).toBeGreaterThan(10);
        expect(faction.color).toMatch(/^#/);
        expect(faction.borderColor).toMatch(/border-/);
        expect(faction.badgeColor).toMatch(/bg-/);
      }
    });
  });

  describe('generateStats', () => {
    it('produces exactly STAT_COUNT stats', () => {
      const stats = generateStats('terran-federation');
      expect(stats).toHaveLength(STAT_COUNT);
    });

    it('keeps all stats within bounds', () => {
      for (let i = 0; i < 50; i++) {
        const stats = generateStats('void-cult');
        for (const stat of stats) {
          expect(stat).toBeGreaterThanOrEqual(0);
          expect(stat).toBeLessThanOrEqual(MAX_STAT);
        }
      }
    });

    it('applies faction stat bonuses to the configured indices', () => {
      const federation = FACTIONS.find((f) => f.id === 'terran-federation')!;
      const samples: number[][] = [];
      for (let i = 0; i < 100; i++) {
        samples.push(generateStats('terran-federation'));
      }

      for (const bonusIndex of federation.statBonus) {
        const sum = samples.reduce((acc, s) => acc + (s[bonusIndex] ?? 0), 0);
        const avgMinBonus = sum / samples.length;
        const fromOtherIndices = samples.reduce((acc, s) => acc + (s[0] ?? 0), 0) / samples.length;
        expect(avgMinBonus).toBeGreaterThan(fromOtherIndices - 1);
      }
    });

    it('produces different results across rerolls (randomness)', () => {
      const a = generateStats('terran-federation');
      const b = generateStats('terran-federation');
      expect(a.join(',')).not.toEqual(b.join(','));
    });
  });

  describe('determineRarity', () => {
    it('maps low totals to Common', () => {
      expect(determineRarity([40, 40, 40, 40, 40])).toBe(0);
    });

    it('maps strong totals to Legendary', () => {
      expect(determineRarity([100, 100, 100, 100, 100])).toBe(4);
    });

    it('is monotonic with total stat value', () => {
      const low = determineRarity([50, 50, 50, 50, 50]);
      const middle = determineRarity([70, 70, 70, 70, 70]);
      const high = determineRarity([90, 90, 90, 90, 90]);
      expect(low).toBeLessThanOrEqual(middle);
      expect(middle).toBeLessThanOrEqual(high);
    });
  });

  describe('getFaction', () => {
    it('finds faction by id', () => {
      expect(getFaction('solari-empire')?.name).toBe('Solari Empire');
    });

    it('returns undefined for unknown ids', () => {
      expect(getFaction('unknown-faction')).toBeUndefined();
    });
  });

  describe('RARITY_LABELS', () => {
    it('has labels matching determineRarity indices', () => {
      expect(RARITY_LABELS).toHaveLength(5);
      expect(RARITY_LABELS[0]).toBe('Common');
      expect(RARITY_LABELS[4]).toBe('Legendary');
    });
  });
});