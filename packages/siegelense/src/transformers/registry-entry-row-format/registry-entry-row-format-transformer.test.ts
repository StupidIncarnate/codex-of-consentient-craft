import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../contracts/instance-state/instance-state.stub';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { RepoLocalPathStub } from '../../contracts/repo-local-path/repo-local-path.stub';
import { SpecNameStub } from '../../contracts/spec-name/spec-name.stub';

import { registryEntryRowFormatTransformer } from './registry-entry-row-format-transformer';

describe('registryEntryRowFormatTransformer', () => {
  describe('a live instance with a recorded heartbeat', () => {
    it('VALID: {alive instance} => joins id, state, spec, ports, last beat and evidence with tabs', () => {
      const entry = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
        state: InstanceStateStub({ value: 'alive' }),
        lastBeatMs: EpochMsStub({ value: 1_700_000_000_000 }),
      });
      const evidence = RepoLocalPathStub({
        path: '/repo/.siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      });

      const result = registryEntryRowFormatTransformer({ entry, evidence });

      expect(result).toBe(
        'inst_7f3a9c21\talive\tdungeonmaster-web\t34172/34173\t1700000000000\t/repo/.siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      );
    });
  });

  describe('an instance with no recorded heartbeat yet', () => {
    it('EMPTY: {lastBeatMs: null} => the last-beat column reads a dash', () => {
      const entry = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_00000000' }),
        specName: SpecNameStub({ value: 'dungeonmaster-headless' }),
        ports: PortPairStub({ api: 34_180, web: 34_181 }),
        state: InstanceStateStub({ value: 'alive' }),
        lastBeatMs: null,
      });
      const evidence = RepoLocalPathStub({
        path: '/repo/.siegelense/unowned/instances/inst_00000000',
      });

      const result = registryEntryRowFormatTransformer({ entry, evidence });

      expect(result).toBe(
        'inst_00000000\talive\tdungeonmaster-headless\t34180/34181\t-\t/repo/.siegelense/unowned/instances/inst_00000000',
      );
    });
  });
});
