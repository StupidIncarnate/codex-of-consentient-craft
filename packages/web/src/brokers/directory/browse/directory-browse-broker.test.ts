import { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';

import { directoryBrowseBroker } from './directory-browse-broker';
import { directoryBrowseBrokerProxy } from './directory-browse-broker.proxy';

describe('directoryBrowseBroker', () => {
  describe('successful browse', () => {
    it('VALID: {path: "/home/user"} => returns directory entries from API', async () => {
      const proxy = directoryBrowseBrokerProxy();
      const entries = [
        DirectoryEntryStub({ name: 'projects', path: '/home/user/projects', isDirectory: true }),
        DirectoryEntryStub({ name: 'readme.md', path: '/home/user/readme.md', isDirectory: false }),
      ];

      proxy.setupEntries({ entries });

      const result = await directoryBrowseBroker({ path: '/home/user' });

      expect(result).toStrictEqual(entries);
    });

    it('VALID: {path: undefined} => returns root directory entries', async () => {
      const proxy = directoryBrowseBrokerProxy();
      const entries = [DirectoryEntryStub({ name: 'home', path: '/home', isDirectory: true })];

      proxy.setupEntries({ entries });

      const result = await directoryBrowseBroker({});

      expect(result).toStrictEqual(entries);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {path: "/empty-dir"} => returns empty array', async () => {
      const proxy = directoryBrowseBrokerProxy();

      proxy.setupEntries({ entries: [] });

      const result = await directoryBrowseBroker({ path: '/empty-dir' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = directoryBrowseBrokerProxy();

      proxy.setupError({ error: new Error('Network failure') });

      await expect(directoryBrowseBroker({ path: '/home/user' })).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = directoryBrowseBrokerProxy();

      proxy.setupInvalidResponse({ data: [{ bad: 'data' }] });

      await expect(directoryBrowseBroker({ path: '/home/user' })).rejects.toThrow(/invalid_type/u);
    });
  });
});
