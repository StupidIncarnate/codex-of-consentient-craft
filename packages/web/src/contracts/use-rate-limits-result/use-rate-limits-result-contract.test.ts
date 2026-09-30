import { UseRateLimitsResultStub } from './use-rate-limits-result.stub';
import { useRateLimitsResultContract } from './use-rate-limits-result-contract';

describe('useRateLimitsResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseRateLimitsResultStub();

      expect(useRateLimitsResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {snapshot: wrong type} => throws', () => {
      expect(() =>
        useRateLimitsResultContract.parse({ ...UseRateLimitsResultStub(), snapshot: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
