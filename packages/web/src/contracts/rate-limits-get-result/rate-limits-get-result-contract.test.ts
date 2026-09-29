import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';

import { rateLimitsGetResultContract } from './rate-limits-get-result-contract';
import { RateLimitsGetResultStub } from './rate-limits-get-result.stub';

describe('rateLimitsGetResultContract', () => {
  describe('valid results', () => {
    it('VALID: {default stub} => parses to the default snapshot', () => {
      const result = rateLimitsGetResultContract.parse(RateLimitsGetResultStub());

      expect(result).toStrictEqual({ snapshot: RateLimitsSnapshotStub() });
    });

    it('EMPTY: {snapshot: null} => keeps null', () => {
      const result = rateLimitsGetResultContract.parse(RateLimitsGetResultStub({ snapshot: null }));

      expect(result).toStrictEqual({ snapshot: null });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {snapshot: {bad}} => throws validation error', () => {
      expect(() => rateLimitsGetResultContract.parse({ snapshot: { bad: 'data' } })).toThrow(
        /snapshot/u,
      );
    });

    it('INVALID: {missing snapshot} => throws validation error', () => {
      expect(() => rateLimitsGetResultContract.parse({})).toThrow(/snapshot/u);
    });
  });
});
