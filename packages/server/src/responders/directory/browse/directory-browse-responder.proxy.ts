import { orchestratorBrowseDirectoriesAdapterProxy } from '../../../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter.proxy';
import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';
import { DirectoryBrowseResponder } from './directory-browse-responder';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const DirectoryBrowseResponderProxy = (): {
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
