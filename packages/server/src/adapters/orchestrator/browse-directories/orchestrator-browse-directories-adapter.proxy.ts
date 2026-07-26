import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { DirectoryEntryStub, GuildPath } from '@dungeonmaster/shared/contracts';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const orchestratorBrowseDirectoriesAdapterProxy = (): {
  returns: (params: { path?: GuildPath; entries: DirectoryEntry[] }) => void;
  throws: (params: { path?: GuildPath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.browseDirectories });

  return {
    returns: ({ path, entries }: { path?: GuildPath; entries: DirectoryEntry[] }): void => {
      mock.calledWith(path === undefined ? [{}] : [{ path }]).returns(entries);
    },
    throws: ({ path, error }: { path?: GuildPath; error: Error }): void => {
      mock.calledWith(path === undefined ? [{}] : [{ path }]).throws(error);
    },
  };
};
