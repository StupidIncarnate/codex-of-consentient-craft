import { FilePathStub, ProjectPathStub } from '@dungeonmaster/shared/contracts';

import { directoryBrowseBroker } from './directory-browse-broker';
import { directoryBrowseBrokerProxy } from './directory-browse-broker.proxy';

describe('directoryBrowseBroker', () => {
  describe('with explicit path', () => {
    it('VALID: {path with directories} => returns directory entries sorted alphabetically', () => {
      const proxy = directoryBrowseBrokerProxy();
      const path = ProjectPathStub({ value: '/home/user' });

      proxy.setupDirectories({
        targetPath: '/home/user',
        directories: [
          { name: 'beta', joinedPath: FilePathStub({ value: '/home/user/beta' }) },
          { name: 'alpha', joinedPath: FilePathStub({ value: '/home/user/alpha' }) },
        ],
        files: [],
        hiddenDirectories: [],
      });

      const result = directoryBrowseBroker({ path });

      expect(result).toStrictEqual([
        { name: 'alpha', path: '/home/user/alpha', isDirectory: true },
        { name: 'beta', path: '/home/user/beta', isDirectory: true },
      ]);
    });

    it('VALID: {path with files and directories} => returns only directories', () => {
      const proxy = directoryBrowseBrokerProxy();
      const path = ProjectPathStub({ value: '/home/user' });

      proxy.setupDirectories({
        targetPath: '/home/user',
        directories: [{ name: 'docs', joinedPath: FilePathStub({ value: '/home/user/docs' }) }],
        files: ['readme.md'],
        hiddenDirectories: [],
      });

      const result = directoryBrowseBroker({ path });

      expect(result).toStrictEqual([{ name: 'docs', path: '/home/user/docs', isDirectory: true }]);
    });

    it('VALID: {path with hidden directories} => hides directories starting with dot', () => {
      const proxy = directoryBrowseBrokerProxy();
      const path = ProjectPathStub({ value: '/home/user' });

      proxy.setupDirectories({
        targetPath: '/home/user',
        directories: [
          { name: 'projects', joinedPath: FilePathStub({ value: '/home/user/projects' }) },
        ],
        files: [],
        hiddenDirectories: ['.config', '.ssh'],
      });

      const result = directoryBrowseBroker({ path });

      expect(result).toStrictEqual([
        { name: 'projects', path: '/home/user/projects', isDirectory: true },
      ]);
    });

    it('EMPTY: {path with no entries} => returns empty array', () => {
      const proxy = directoryBrowseBrokerProxy();
      const path = ProjectPathStub({ value: '/home/user/empty' });

      proxy.setupEmpty();

      const result = directoryBrowseBroker({ path });

      expect(result).toStrictEqual([]);
    });
  });

  describe('without path (defaults to home directory)', () => {
    it('VALID: {no path provided} => uses home directory and returns entries', () => {
      const proxy = directoryBrowseBrokerProxy();

      proxy.setupDefaultHomedir({
        homeDir: '/home/default',
        directories: [{ name: 'docs', joinedPath: FilePathStub({ value: '/home/default/docs' }) }],
      });

      const result = directoryBrowseBroker({});

      expect(result).toStrictEqual([
        { name: 'docs', path: '/home/default/docs', isDirectory: true },
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {invalid path} => throws error from readdir', () => {
      const proxy = directoryBrowseBrokerProxy();
      const path = ProjectPathStub({ value: '/nonexistent' });

      proxy.setupThrows({ error: new Error('ENOENT: no such file or directory') });

      expect(() => directoryBrowseBroker({ path })).toThrow(/ENOENT/u);
    });
  });
});
