import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsState } from '../../../state/rate-limits/rate-limits-state';
import { RateLimitsGetResponder } from './rate-limits-get-responder';
import { RateLimitsGetResponderProxy } from './rate-limits-get-responder.proxy';

describe('RateLimitsGetResponder', () => {
  it('EMPTY: {fresh state} => returns null', () => {
    RateLimitsGetResponderProxy();

    expect(RateLimitsGetResponder()).toBe(null);
  });

  it('VALID: {snapshot in state} => returns the snapshot', () => {
    RateLimitsGetResponderProxy();
    const snapshot = RateLimitsSnapshotStub();
    rateLimitsState.set({ snapshot });

    expect(RateLimitsGetResponder()).toStrictEqual(snapshot);
  });
});
