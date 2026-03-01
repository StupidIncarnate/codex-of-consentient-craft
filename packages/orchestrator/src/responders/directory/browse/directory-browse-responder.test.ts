import { FilePathStub, GuildPathStub } from '@dungeonmaster/shared/contracts';

import { DirectoryBrowseResponderProxy } from './directory-browse-responder.proxy';

describe('DirectoryBrowseResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {path} => delegates to directoryBrowseBroker and returns directory entries', () => {
      const proxy = DirectoryBrowseResponderProxy();
      proxy.setupDirectories({
        targetPath: '/home/user/projects',
        directories: [
          { name: 'app', joinedPath: FilePathStub({ value: '/home/user/projects/app' }) },
        ],
        files: [],
        hiddenDirectories: [],
      });

      const result = proxy.callResponder({
        path: GuildPathStub({ value: '/home/user/projects' }),
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('app');
    });

    it('VALID: {path: undefined} => delegates with empty object for default homedir', () => {
      const proxy = DirectoryBrowseResponderProxy();
      proxy.setupDefaultHomedir({
        homeDir: '/home/user',
        directories: [{ name: 'docs', joinedPath: FilePathStub({ value: '/home/user/docs' }) }],
      });

      const result = proxy.callResponder({});

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('docs');
    });
  });
});
