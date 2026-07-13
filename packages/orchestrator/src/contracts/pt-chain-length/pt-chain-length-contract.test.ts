import { ptChainLengthContract } from './pt-chain-length-contract';
import { PtChainLengthStub } from './pt-chain-length.stub';

describe('ptChainLengthContract', () => {
  describe('valid counts', () => {
    it('VALID: {zero} => parses successfully', () => {
      const count = PtChainLengthStub({ value: 0 });

      const result = ptChainLengthContract.parse(count);

      expect(result).toBe(0);
    });

    it('VALID: {positive integer} => parses successfully', () => {
      const count = PtChainLengthStub({ value: 2 });

      const result = ptChainLengthContract.parse(count);

      expect(result).toBe(2);
    });
  });

  describe('invalid counts', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        ptChainLengthContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        ptChainLengthContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
