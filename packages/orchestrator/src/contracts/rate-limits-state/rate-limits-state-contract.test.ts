import { RateLimitsStateStub } from './rate-limits-state.stub';
import { rateLimitsStateContract } from './rate-limits-state-contract';

describe('rateLimitsStateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = RateLimitsStateStub();

      expect(rateLimitsStateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {snapshot: wrong type} => throws', () => {
      expect(() =>
        rateLimitsStateContract.parse({ ...RateLimitsStateStub(), snapshot: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
