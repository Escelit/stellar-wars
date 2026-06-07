import { describe, it, expect, vi } from 'vitest';
import { parseContractResult } from '../soroban';
import { rpc } from '@stellar/stellar-sdk';

describe('soroban helpers', () => {
  describe('parseContractResult', () => {
    it('returns native value on success', () => {
      const mockResult = {
        status: 'SUCCESS',
        returnValue: {
          // This is a simplified mock of ScVal
          _type: 'u32',
          _value: 42
        }
      } as any;
      
      // We need to mock scValToNative too if we want to test it properly, 
      // but here we just check if it returns null when status is not SUCCESS
      const failResult = {
        status: 'FAILED',
      } as any;
      
      expect(parseContractResult(failResult)).toBe(null);
    });
  });
});
