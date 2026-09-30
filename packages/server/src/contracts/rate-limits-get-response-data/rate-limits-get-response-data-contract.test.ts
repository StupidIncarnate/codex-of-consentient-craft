import { rateLimitsGetResponseDataContract } from './rate-limits-get-response-data-contract';
import { RateLimitsGetResponseDataStub } from './rate-limits-get-response-data.stub';
import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';

describe('rateLimitsGetResponseDataContract', () => {
  it('VALID: {default stub} => parses to the snapshot', () => {
    const result = RateLimitsGetResponseDataStub();

    expect(rateLimitsGetResponseDataContract.parse(result)).toStrictEqual({
      snapshot: RateLimitsSnapshotStub(),
    });
  });

  it('EMPTY: {snapshot: null} => parses a missing snapshot', () => {
    expect(rateLimitsGetResponseDataContract.parse({ snapshot: null })).toStrictEqual({
      snapshot: null,
    });
  });

  it('INVALID: {missing snapshot} => throws validation error', () => {
    expect(() => rateLimitsGetResponseDataContract.parse({})).toThrow(/received undefined/u);
  });
});
