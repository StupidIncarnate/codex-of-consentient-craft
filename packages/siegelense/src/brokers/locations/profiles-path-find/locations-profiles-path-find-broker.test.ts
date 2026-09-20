import { locationsProfilesPathFindBroker } from './locations-profiles-path-find-broker';
import { locationsProfilesPathFindBrokerProxy } from './locations-profiles-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { SpecHashStub } from '../../../contracts/spec-hash/spec-hash.stub';

describe('locationsProfilesPathFindBroker', () => {
  describe('profiles path resolution', () => {
    it('VALID: {specHash: a3f9c2e1} => returns the profile directory keyed on the hash', () => {
      const proxy = locationsProfilesPathFindBrokerProxy();
      const specHash = SpecHashStub({ value: 'a3f9c2e1' });

      proxy.setupProfilesPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        profilesPath: FilePathStub({
          value: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1',
        }),
      });

      const result = locationsProfilesPathFindBroker({ specHash });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1' }),
      );
    });

    it('EDGE: {specHash: a different 64-char hash} => returns the profile directory keyed on that hash', () => {
      const proxy = locationsProfilesPathFindBrokerProxy();
      const longHash = 'f'.repeat(64);
      const specHash = SpecHashStub({ value: longHash });

      proxy.setupProfilesPath({
        homeDir: '/srv/agents/worker-3/state',
        homePath: FilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/srv/agents/worker-3/state/.dungeonmaster/siegelense' }),
        profilesPath: FilePathStub({
          value: `/srv/agents/worker-3/state/.dungeonmaster/siegelense/profiles/${longHash}`,
        }),
      });

      const result = locationsProfilesPathFindBroker({ specHash });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: `/srv/agents/worker-3/state/.dungeonmaster/siegelense/profiles/${longHash}`,
        }),
      );
    });
  });
});
