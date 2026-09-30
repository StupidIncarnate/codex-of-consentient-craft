

import { locationsProfileDirsFindBroker } from './locations-profile-dirs-find-broker';
import { locationsProfileDirsFindBrokerProxy } from './locations-profile-dirs-find-broker.proxy';

describe('locationsProfileDirsFindBroker', () => {
  describe('profile directory resolution', () => {
    it('VALID: {specHash: a3f9c2e1} => returns the samples and boots directories under that hash', () => {
      const proxy = locationsProfileDirsFindBrokerProxy();
      const specHash = 'a3f9c2e1';

      proxy.setupProfilesPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        rootPath: '/home/user/.dungeonmaster/siegelense',
        profilesPath: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1',
      });

      const result = locationsProfileDirsFindBroker({ specHash });

      expect(result).toStrictEqual({
        samplesDir: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1/samples',
        bootsDir: '/home/user/.dungeonmaster/siegelense/profiles/a3f9c2e1/boots',
      });
    });

    it('EDGE: {a different spec hash} => both directories move with the hash, so a changed spec re-measures', () => {
      const proxy = locationsProfileDirsFindBrokerProxy();
      const longHash = 'f'.repeat(64);
      const specHash = longHash;

      proxy.setupProfilesPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        rootPath: '/home/user/.dungeonmaster/siegelense',
        profilesPath: `/home/user/.dungeonmaster/siegelense/profiles/${longHash}`,
      });

      const result = locationsProfileDirsFindBroker({ specHash });

      expect(result).toStrictEqual({
        samplesDir: `/home/user/.dungeonmaster/siegelense/profiles/${longHash}/samples`,
        bootsDir: `/home/user/.dungeonmaster/siegelense/profiles/${longHash}/boots`,
      });
    });
  });
});
