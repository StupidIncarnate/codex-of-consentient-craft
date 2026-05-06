import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetRateLimitsAdapter } from './orchestrator-get-rate-limits-adapter';
import { orchestratorGetRateLimitsAdapterProxy } from './orchestrator-get-rate-limits-adapter.proxy';

describe('orchestratorGetRateLimitsAdapter', () => {
  it('VALID: {snapshot present} => returns snapshot', () => {
    const proxy = orchestratorGetRateLimitsAdapterProxy();
    const snapshot = RateLimitsSnapshotStub();
    proxy.returns({ snapshot });

    const result = orchestratorGetRateLimitsAdapter();

    expect(result).toStrictEqual(snapshot);
  });

  it('EMPTY: {snapshot null} => returns null', () => {
    const proxy = orchestratorGetRateLimitsAdapterProxy();
    proxy.returns({ snapshot: null });

    const result = orchestratorGetRateLimitsAdapter();

    expect(result).toBe(null);
  });
});
