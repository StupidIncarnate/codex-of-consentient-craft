import { DirectoryEntryStub, GuildPathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorBrowseDirectoriesAdapter } from './orchestrator-browse-directories-adapter';
import { orchestratorBrowseDirectoriesAdapterProxy } from './orchestrator-browse-directories-adapter.proxy';

describe('orchestratorBrowseDirectoriesAdapter', () => {
  describe('successful browse', () => {
    it('VALID: {path} => returns directory entries', () => {
      const proxy = orchestratorBrowseDirectoriesAdapterProxy();
      const path = GuildPathStub({ value: '/home/user' });
      const entries = [DirectoryEntryStub()];

      proxy.returns({ path, entries });

      const result = orchestratorBrowseDirectoriesAdapter({ path });

      expect(result).toStrictEqual(entries);
    });

    it('VALID: {no path} => returns directory entries for default path', () => {
      const proxy = orchestratorBrowseDirectoriesAdapterProxy();

      proxy.returns({ entries: [] });

      const result = orchestratorBrowseDirectoriesAdapter({});

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorBrowseDirectoriesAdapterProxy();
      const path = GuildPathStub({ value: '/nonexistent' });

      proxy.throws({ path, error: new Error('Directory not found') });

      expect(() => orchestratorBrowseDirectoriesAdapter({ path })).toThrow(/Directory not found/u);
    });
  });
});
