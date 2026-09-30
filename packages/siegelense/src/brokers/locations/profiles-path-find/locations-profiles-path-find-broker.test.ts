import { locationsProfilesPathFindBroker } from './locations-profiles-path-find-broker';
import { locationsProfilesPathFindBrokerProxy } from './locations-profiles-path-find-broker.proxy';

describe('locationsProfilesPathFindBroker', () => {
  describe('profiles path resolution', () => {
    it('VALID: {specHash: a3f9c2e1} => returns the profile directory keyed on the hash', () => {
      const proxy = locationsProfilesPathFindBrokerProxy();
      const specHash = 'a3f9c2e1';

      proxy.setupProfilesPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        rootPath: '/home/user/.dungeonmaster/siegelense',
        profilesPath: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1',
      });

      const result = locationsProfilesPathFindBroker({ specHash });

      expect(result).toBe('/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1');
    });

    it('EDGE: {specHash: a different 64-char hash} => returns the profile directory keyed on that hash', () => {
      const proxy = locationsProfilesPathFindBrokerProxy();
      const longHash = 'f'.repeat(64);
      const specHash = longHash;

      proxy.setupProfilesPath({
        homeDir: '/srv/agents/worker-3/state',
        homePath: '/srv/agents/worker-3/state/.dungeonmaster',
        rootPath: '/srv/agents/worker-3/state/.dungeonmaster/siegelense',
        profilesPath: `/srv/agents/worker-3/state/.dungeonmaster/siegelense/profiles/${longHash}`,
      });

      const result = locationsProfilesPathFindBroker({ specHash });

      expect(result).toBe(
        `/srv/agents/worker-3/state/.dungeonmaster/siegelense/profiles/${longHash}`,
      );
    });
  });
});
