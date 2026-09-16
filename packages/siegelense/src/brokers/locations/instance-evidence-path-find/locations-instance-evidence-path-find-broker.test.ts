import { locationsInstanceEvidencePathFindBroker } from './locations-instance-evidence-path-find-broker';
import { locationsInstanceEvidencePathFindBrokerProxy } from './locations-instance-evidence-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';

describe('locationsInstanceEvidencePathFindBroker', () => {
  describe('a guild owns the instance', () => {
    it('VALID: {guildId: f47ac10b-...} => returns the guild-partitioned evidence path', () => {
      const proxy = locationsInstanceEvidencePathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupInstanceEvidencePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        evidencePath: FilePathStub({
          value:
            '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
        }),
      });

      const result = locationsInstanceEvidencePathFindBroker({ instanceId, guildId });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value:
            '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
        }),
      );
    });
  });

  describe('no quest dispatched the instance', () => {
    it('EMPTY: {guildId: null} => returns the unowned-partitioned evidence path', () => {
      const proxy = locationsInstanceEvidencePathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });

      proxy.setupInstanceEvidencePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        evidencePath: FilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
        }),
      });

      const result = locationsInstanceEvidencePathFindBroker({ instanceId, guildId: null });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
        }),
      );
    });
  });
});
