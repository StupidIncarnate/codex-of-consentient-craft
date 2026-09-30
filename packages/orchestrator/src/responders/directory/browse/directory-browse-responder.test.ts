import { DirectoryBrowseResponderProxy } from './directory-browse-responder.proxy';

describe('DirectoryBrowseResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {path} => delegates to directoryBrowseBroker and returns directory entries', () => {
      const proxy = DirectoryBrowseResponderProxy();
      proxy.setupDirectories({
        targetPath: '/home/user/projects',
        directories: [{ name: 'app', joinedPath: '/home/user/projects/app' }],
        files: [],
        hiddenDirectories: [],
      });

      const result = proxy.callResponder({
        path: '/home/user/projects',
      });

      expect(result).toStrictEqual([
        { name: 'app', path: '/home/user/projects/app', isDirectory: true },
      ]);
    });

    it('VALID: {path: undefined} => delegates with empty object for default homedir', () => {
      const proxy = DirectoryBrowseResponderProxy();
      proxy.setupDefaultHomedir({
        homeDir: '/home/user',
        directories: [{ name: 'docs', joinedPath: '/home/user/docs' }],
      });

      const result = proxy.callResponder({});

      expect(result).toStrictEqual([{ name: 'docs', path: '/home/user/docs', isDirectory: true }]);
    });
  });
});
