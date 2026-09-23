import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../../contracts/instance-state/instance-state.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

import { SiegelenseFleetResponder } from './siegelense-fleet-responder';
import { SiegelenseFleetResponderProxy } from './siegelense-fleet-responder.proxy';

describe('SiegelenseFleetResponder', () => {
  describe('no instances running', () => {
    it('EMPTY: {registry: no instances} => writes exactly the empty-fleet sentence, no table, no footer', async () => {
      const proxy = SiegelenseFleetResponderProxy();
      proxy.stageEmptyRegistry();

      await SiegelenseFleetResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual(['No siegelense instances running.\n']);
    });
  });

  describe('two killed instances', () => {
    it('VALID: {two killed rows, one with a last beat, one without} => aligned table, the evidence shape once, and the tombstone footer counting both', async () => {
      const proxy = SiegelenseFleetResponderProxy();
      const nowMs = EpochMsStub({ value: 100_000_000 });
      proxy.stageNow({ nowMs });
      proxy.stageInstances({
        entries: [
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_0ac4219441534a54872b9c3a478d99d8' }),
            specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
            ports: PortPairStub({ api: 33_107, web: 34_781 }),
            state: InstanceStateStub({ value: 'killed' }),
            lastBeatMs: EpochMsStub({ value: 53_200_000 }),
          }),
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_46d7275f6223479b9d6933ba5b8f0381' }),
            specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
            ports: PortPairStub({ api: 33_683, web: 42_907 }),
            state: InstanceStateStub({ value: 'killed' }),
            lastBeatMs: null,
          }),
        ],
      });

      await SiegelenseFleetResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual([
        '┌───────────────────────────────────────┬────────┬─────────────────────┬─────────────┬───────────┐\n' +
          '│ ID                                    │ STATE  │ SPEC                │ PORTS       │ LAST BEAT │\n' +
          '├───────────────────────────────────────┼────────┼─────────────────────┼─────────────┼───────────┤\n' +
          '│ inst_0ac4219441534a54872b9c3a478d99d8 │ killed │ dungeonmaster-stack │ 33107/34781 │ 13h       │\n' +
          '│ inst_46d7275f6223479b9d6933ba5b8f0381 │ killed │ dungeonmaster-stack │ 33683/42907 │ -         │\n' +
          '└───────────────────────────────────────┴────────┴─────────────────────┴─────────────┴───────────┘\n',
        '\nevidence: <repoRoot>/.dungeonmaster-assets/siegelense-assets/{unowned|guilds/<guildId>}/instances/<id>/\n',
        '\n2 killed — tombstones, not leaks: no process, no port, no memory. The row and its evidence\n' +
          'are kept so `results` and `status` still answer for a dead instance, which is the normal\n' +
          'case for anyone reading a run that broke. No built call removes them; that is `prune`.\n',
      ]);
    });
  });

  describe('no killed instances, spec names of different lengths', () => {
    it('VALID: {an alive row and a dead row, no killed row} => the SPEC column widens for the longer name and every row realigns, no footer', async () => {
      const proxy = SiegelenseFleetResponderProxy();
      const nowMs = EpochMsStub({ value: 1_700_000_000_000 });
      proxy.stageNow({ nowMs });
      proxy.stageInstances({
        entries: [
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_7f3a9c21' }),
            specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
            ports: PortPairStub({ api: 34_172, web: 34_173 }),
            state: InstanceStateStub({ value: 'alive' }),
            lastBeatMs: EpochMsStub({ value: 1_699_967_600_000 }),
          }),
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_00000000' }),
            specName: SpecNameStub({ value: 'dungeonmaster-api' }),
            ports: PortPairStub({ api: 34_180, web: 34_181 }),
            state: InstanceStateStub({ value: 'dead' }),
            lastBeatMs: null,
          }),
        ],
      });

      await SiegelenseFleetResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual([
        '┌───────────────┬───────┬─────────────────────┬─────────────┬───────────┐\n' +
          '│ ID            │ STATE │ SPEC                │ PORTS       │ LAST BEAT │\n' +
          '├───────────────┼───────┼─────────────────────┼─────────────┼───────────┤\n' +
          '│ inst_7f3a9c21 │ alive │ dungeonmaster-stack │ 34172/34173 │ 9h        │\n' +
          '│ inst_00000000 │ dead  │ dungeonmaster-api   │ 34180/34181 │ -         │\n' +
          '└───────────────┴───────┴─────────────────────┴─────────────┴───────────┘\n',
        '\nevidence: <repoRoot>/.dungeonmaster-assets/siegelense-assets/{unowned|guilds/<guildId>}/instances/<id>/\n',
      ]);
    });
  });
});
