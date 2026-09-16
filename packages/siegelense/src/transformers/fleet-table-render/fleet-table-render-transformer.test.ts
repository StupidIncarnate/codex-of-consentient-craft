import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../contracts/instance-state/instance-state.stub';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { SpecNameStub } from '../../contracts/spec-name/spec-name.stub';

import { fleetTableRenderTransformer } from './fleet-table-render-transformer';

describe('fleetTableRenderTransformer', () => {
  describe('no entries', () => {
    it('EMPTY: {entries: []} => the header line alone', () => {
      const result = fleetTableRenderTransformer({ entries: [], nowMs: EpochMsStub() });

      expect(result).toBe('ID  STATE  SPEC  PORTS  LAST BEAT\n');
    });
  });

  describe('one entry with no recorded heartbeat', () => {
    it('EMPTY: {lastBeatMs: null} => the LAST BEAT column reads a dash', () => {
      const entry = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_00000000' }),
        specName: SpecNameStub({ value: 'dungeonmaster-headless' }),
        ports: PortPairStub({ api: 34_180, web: 34_181 }),
        state: InstanceStateStub({ value: 'alive' }),
        lastBeatMs: null,
      });

      const result = fleetTableRenderTransformer({ entries: [entry], nowMs: EpochMsStub() });

      expect(result).toBe(
        'ID             STATE  SPEC                    PORTS        LAST BEAT\n' +
          'inst_00000000  alive  dungeonmaster-headless  34180/34181  -\n',
      );
    });
  });

  describe('one entry with a recorded heartbeat', () => {
    it('VALID: {nowMs - lastBeatMs = 13h} => LAST BEAT renders the same age elapsedRenderTransformer produces', () => {
      const entry = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_0ac4219441534a54872b9c3a478d99d8' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        ports: PortPairStub({ api: 33_107, web: 34_781 }),
        state: InstanceStateStub({ value: 'killed' }),
        lastBeatMs: EpochMsStub({ value: 53_200_000 }),
      });

      const result = fleetTableRenderTransformer({
        entries: [entry],
        nowMs: EpochMsStub({ value: 100_000_000 }),
      });

      expect(result).toBe(
        'ID                                     STATE   SPEC               PORTS        LAST BEAT\n' +
          'inst_0ac4219441534a54872b9c3a478d99d8  killed  dungeonmaster-web  33107/34781  13h\n',
      );
    });
  });

  describe('two entries whose spec names differ in length', () => {
    it('VALID: {a short spec name and a longer one} => the SPEC column widens to the longer name and every row realigns, never fixed-width tabs', () => {
      const entries = [
        RegistryEntryStub({
          id: InstanceIdStub({ value: 'inst_7f3a9c21' }),
          specName: SpecNameStub({ value: 'dungeonmaster-web' }),
          ports: PortPairStub({ api: 34_172, web: 34_173 }),
          state: InstanceStateStub({ value: 'alive' }),
          lastBeatMs: EpochMsStub({ value: 1_699_967_600_000 }),
        }),
        RegistryEntryStub({
          id: InstanceIdStub({ value: 'inst_00000000' }),
          specName: SpecNameStub({ value: 'dungeonmaster-headless' }),
          ports: PortPairStub({ api: 34_180, web: 34_181 }),
          state: InstanceStateStub({ value: 'dead' }),
          lastBeatMs: null,
        }),
      ];

      const result = fleetTableRenderTransformer({
        entries,
        nowMs: EpochMsStub({ value: 1_700_000_000_000 }),
      });

      expect(result).toBe(
        'ID             STATE  SPEC                    PORTS        LAST BEAT\n' +
          'inst_7f3a9c21  alive  dungeonmaster-web       34172/34173  9h\n' +
          'inst_00000000  dead   dungeonmaster-headless  34180/34181  -\n',
      );
    });
  });
});
