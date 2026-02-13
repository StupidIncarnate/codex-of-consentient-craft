jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const orchestratorBrowseDirectoriesAdapterProxy = (): {
  returns: (params: { entries: DirectoryEntry[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.browseDirectories);

  mock.mockReturnValue([]);

  return {
    returns: ({ entries }: { entries: DirectoryEntry[] }): void => {
      mock.mockReturnValueOnce(entries);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
