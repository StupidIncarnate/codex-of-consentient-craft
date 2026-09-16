import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

import { instanceStateResolveBroker } from './instance-state-resolve-broker';
import { instanceStateResolveBrokerProxy } from './instance-state-resolve-broker.proxy';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const OTHER_INSTANCE_ID = InstanceIdStub({ value: 'inst_00000000' });
const LAST_BEAT_MS = EpochMsStub({ value: 1_700_000_000_000 }).valueOf();

describe('instanceStateResolveBroker', () => {
  it('EMPTY: {no registry row for this instance id} => returns unknown with a null entry', async () => {
    const proxy = instanceStateResolveBrokerProxy();
    const otherEntry = RegistryEntryStub({ id: OTHER_INSTANCE_ID, state: 'alive' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [otherEntry] }) });

    const result = await instanceStateResolveBroker({ instanceId: INSTANCE_ID });

    expect(result).toStrictEqual({ state: 'unknown', entry: null });
  });

  it('VALID: {registry row state: pruned} => returns pruned with the row', async () => {
    const proxy = instanceStateResolveBrokerProxy();
    const entry = RegistryEntryStub({
      id: INSTANCE_ID,
      state: 'pruned',
      prunedAtMs: EpochMsStub({ value: 1_700_000_100_000 }),
      prunedByRule: 'stale by 3 beats',
    });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

    const result = await instanceStateResolveBroker({ instanceId: INSTANCE_ID });

    expect(result).toStrictEqual({ state: 'pruned', entry });
  });

  it('VALID: {registry row state: killed} => returns killed with the row', async () => {
    const proxy = instanceStateResolveBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed', pid: null, pgids: [] });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

    const result = await instanceStateResolveBroker({ instanceId: INSTANCE_ID });

    expect(result).toStrictEqual({ state: 'killed', entry });
  });

  it('VALID: {registry row state: alive, heartbeat fresh} => returns alive with the row', async () => {
    const proxy = instanceStateResolveBrokerProxy();
    const entry = RegistryEntryStub({
      id: INSTANCE_ID,
      state: 'alive',
      lastBeatMs: EpochMsStub({ value: LAST_BEAT_MS }),
    });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    // 5000ms since the last beat — inside the 15000ms staleness window (3 beats at a 5000ms
    // interval), so this row is not yet stale.
    proxy.setupNow({ nowMs: LAST_BEAT_MS + 5000 });

    const result = await instanceStateResolveBroker({ instanceId: INSTANCE_ID });

    expect(result).toStrictEqual({ state: 'alive', entry });
  });

  it('VALID: {registry row state: alive, heartbeat stale} => returns dead with the row', async () => {
    const proxy = instanceStateResolveBrokerProxy();
    const entry = RegistryEntryStub({
      id: INSTANCE_ID,
      state: 'alive',
      lastBeatMs: EpochMsStub({ value: LAST_BEAT_MS }),
    });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    // 20000ms since the last beat — past the 15000ms staleness window, so a row nobody updated
    // after a SIGKILL resolves as dead rather than the alive the row itself still claims.
    proxy.setupNow({ nowMs: LAST_BEAT_MS + 20_000 });

    const result = await instanceStateResolveBroker({ instanceId: INSTANCE_ID });

    expect(result).toStrictEqual({ state: 'dead', entry });
  });
});
