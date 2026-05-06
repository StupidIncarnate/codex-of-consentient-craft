import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsState } from './rate-limits-state';
import { rateLimitsStateProxy } from './rate-limits-state.proxy';

describe('rateLimitsState', () => {
  it('EMPTY: {fresh} => get returns null', () => {
    const proxy = rateLimitsStateProxy();
    proxy.reset();

    expect(rateLimitsState.get()).toBe(null);
  });

  it('VALID: {set then get} => returns the set snapshot', () => {
    const proxy = rateLimitsStateProxy();
    proxy.reset();
    const snapshot = RateLimitsSnapshotStub();

    rateLimitsState.set({ snapshot });

    expect(rateLimitsState.get()).toStrictEqual(snapshot);
  });

  it('VALID: {set null} => returns null', () => {
    const proxy = rateLimitsStateProxy();
    proxy.reset();

    rateLimitsState.set({ snapshot: null });

    expect(rateLimitsState.get()).toBe(null);
  });

  it('VALID: {clear} => returns null after clear', () => {
    const proxy = rateLimitsStateProxy();
    proxy.reset();
    rateLimitsState.set({ snapshot: RateLimitsSnapshotStub() });

    rateLimitsState.clear();

    expect(rateLimitsState.get()).toBe(null);
  });
});
