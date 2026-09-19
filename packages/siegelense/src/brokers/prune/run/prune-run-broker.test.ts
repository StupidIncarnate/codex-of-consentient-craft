import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { PruneQueryStub } from '../../../contracts/prune-query/prune-query.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { pruneRunBroker } from './prune-run-broker';
import { pruneRunBrokerProxy } from './prune-run-broker.proxy';

const NOW_MS = 1_700_000_000_000;
const LIVE_ID = 'inst_9b2c0001';
const SECOND_LIVE_ID = 'inst_1d090002';

describe('pruneRunBroker', () => {
  describe('a live fleet', () => {
    it('VALID: {one live instance, olderThan 7d} => nothing freed, the instance refused by name, and the unchecked-kind list empty because no tree was reached', async () => {
      const proxy = pruneRunBrokerProxy();
      proxy.setupRegistry({
        json: JSON.stringify({
          instances: [
            RegistryEntryStub({
              id: InstanceIdStub({ value: LIVE_ID }),
              state: 'alive',
              questId: null,
              guildId: null,
              bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
              lastBeatMs: EpochMsStub({ value: NOW_MS - 2000 }),
            }),
          ],
        }),
      });

      const result = await pruneRunBroker({ query: PruneQueryStub() });

      expect(result).toStrictEqual({
        freedMB: 0,
        freedBytes: 0,
        removed: [],
        refused: [{ id: LIVE_ID, why: 'live — last beat 2s ago' }],
        unresolved: [],
      });
    });

    it('VALID: {--instance naming one of two live rows} => only that row is reported, so a prune never touches a neighbour', async () => {
      const proxy = pruneRunBrokerProxy();
      proxy.setupRegistry({
        json: JSON.stringify({
          instances: [
            RegistryEntryStub({
              id: InstanceIdStub({ value: LIVE_ID }),
              state: 'alive',
              questId: null,
              guildId: null,
              bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
              lastBeatMs: EpochMsStub({ value: NOW_MS - 2000 }),
            }),
            RegistryEntryStub({
              id: InstanceIdStub({ value: SECOND_LIVE_ID }),
              state: 'alive',
              questId: null,
              guildId: null,
              bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
              lastBeatMs: EpochMsStub({ value: NOW_MS - 5000 }),
            }),
          ],
        }),
      });

      const result = await pruneRunBroker({
        query: PruneQueryStub({ instanceId: InstanceIdStub({ value: SECOND_LIVE_ID }) }),
      });

      expect(result.refused).toStrictEqual([
        { id: SECOND_LIVE_ID, why: 'live — last beat 5s ago' },
      ]);
    });
  });

  describe('an empty machine', () => {
    it('EMPTY: {no instances at all} => an all-zero answer rather than a throw', async () => {
      const proxy = pruneRunBrokerProxy();
      proxy.setupRegistry({ json: JSON.stringify({ instances: [] }) });

      const result = await pruneRunBroker({ query: PruneQueryStub() });

      expect(result).toStrictEqual({
        freedMB: 0,
        freedBytes: 0,
        removed: [],
        refused: [],
        unresolved: [],
      });
    });
  });

  describe('an id the registry does not hold', () => {
    it('ERROR: {--instance inst_deadbeef} => refuses by name rather than sweeping the whole registry', async () => {
      const proxy = pruneRunBrokerProxy();
      proxy.setupRegistry({ json: JSON.stringify({ instances: [] }) });

      await expect(
        pruneRunBroker({
          query: PruneQueryStub({ instanceId: InstanceIdStub({ value: 'inst_deadbeef' }) }),
        }),
      ).rejects.toThrow(
        /^No instance by the id "inst_deadbeef" — unknown, never existed\. Check the id dungeonmaster siegelense start returned\.$/u,
      );
    });
  });
});
