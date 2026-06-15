import { describe, it, expect } from 'vitest';
import { parseContractResult } from '../soroban';

describe('soroban helpers', () => {
  describe('parseContractResult', () => {
    it('returns null when status is not SUCCESS', () => {
      const failResult = {
        status: 'FAILED',
      };
      
      expect(parseContractResult(failResult as never)).toBe(null);
    });
  });
});
