import { describe, it, expect } from 'vitest';
import { xdr } from '@stellar/stellar-sdk';
import { parseContractResult } from '../soroban';

describe('soroban helpers', () => {
  describe('parseContractResult', () => {
    it('returns null when status is not SUCCESS', () => {
      const failResult = {
        status: 'FAILED',
      };

      expect(parseContractResult(failResult as never)).toBe(null);
    });

    it('returns null when status is SUCCESS but no return value present', () => {
      const emptyResult = {
        status: 'SUCCESS',
      };

      expect(parseContractResult(emptyResult as never)).toBe(null);
    });

    it('converts an ScVal u32 return value to a native number', () => {
      const successResult = {
        status: 'SUCCESS',
        returnValue: xdr.ScVal.scvU32(42),
      };

      expect(parseContractResult(successResult as never)).toBe(42);
    });

    it('converts an ScVal string return value to a native string', () => {
      const successResult = {
        status: 'SUCCESS',
        returnValue: xdr.ScVal.scvString('hello'),
      };

      expect(parseContractResult(successResult as never)).toBe('hello');
    });
  });
});