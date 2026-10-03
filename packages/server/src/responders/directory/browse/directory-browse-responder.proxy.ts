import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';
import { DirectoryBrowseResponder } from './directory-browse-responder';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const DirectoryBrowseResponderProxy = (): {
  // No path param: this proxy stages before the test picks a request body, so it can't know
  // whether callResponder will send a path. The composed proxy's path is optional for exactly
  // this reason — omitting it stages a wildcard that answers any browseDirectories call.
  setupBrowse: (params: { entries: DirectoryEntry[] }) => void;
  setupBrowseError: (params: { message: string }) => void;
  callResponder: typeof DirectoryBrowseResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupBrowse: ({ entries }: { entries: DirectoryEntry[] }): void => {
      orchestrator.browseDirectoriesReturns({ entries });
    },
    setupBrowseError: ({ message }: { message: string }): void => {
      orchestrator.browseDirectoriesThrows({ error: NativeErrorStub({ message }) });
    },
    callResponder: DirectoryBrowseResponder,
  };
};
