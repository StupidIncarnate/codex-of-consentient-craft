import { orchestratorBrowseDirectoriesAdapterProxy } from '../../../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter.proxy';
import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';
import { DirectoryBrowseResponder } from './directory-browse-responder';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const DirectoryBrowseResponderProxy = (): {
  // No path param: this proxy stages before the test picks a request body, so it can't know
  // whether callResponder will send a path. The adapter proxy's path is optional for exactly
  // this reason — omitting it stages a wildcard that answers any browseDirectories call.
  setupBrowse: (params: { entries: DirectoryEntry[] }) => void;
  setupBrowseError: (params: { message: string }) => void;
  callResponder: typeof DirectoryBrowseResponder;
} => {
  const adapterProxy = orchestratorBrowseDirectoriesAdapterProxy();

  return {
    setupBrowse: ({ entries }: { entries: DirectoryEntry[] }): void => {
      adapterProxy.returns({ entries });
    },
    setupBrowseError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: DirectoryBrowseResponder,
  };
};
