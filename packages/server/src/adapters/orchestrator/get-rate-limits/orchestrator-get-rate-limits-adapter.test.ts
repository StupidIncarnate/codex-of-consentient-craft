import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetRateLimitsAdapter } from './orchestrator-get-rate-limits-adapter';
import { orchestratorGetRateLimitsAdapterProxy } from './orchestrator-get-rate-limits-adapter.proxy';

describe('orchestratorGetRateLimitsAdapter', () => {
  it('VALID: {snapshot present} => returns snapshot', async () => {
    const proxy = orchestratorGetRateLimitsAdapterProxy();
    const snapshot = RateLimitsSnapshotStub();
    proxy.returns({ snapshot });

    const result = await orchestratorGetRateLimitsAdapter();

    expect(result).toStrictEqual(snapshot);
  });

  it('EMPTY: {snapshot null} => returns null', async () => {
    const proxy = orchestratorGetRateLimitsAdapterProxy();
    proxy.returns({ snapshot: null });

    const result = await orchestratorGetRateLimitsAdapter();

    expect(result).toBe(null);
  });

  it('ERROR: {the ledger read fails} => rejects with the orchestrator error', async () => {
    const proxy = orchestratorGetRateLimitsAdapterProxy();
    proxy.throws({ error: new Error('usage ledger unreadable') });

    await expect(orchestratorGetRateLimitsAdapter()).rejects.toThrow(/^usage ledger unreadable$/u);
  });
});
