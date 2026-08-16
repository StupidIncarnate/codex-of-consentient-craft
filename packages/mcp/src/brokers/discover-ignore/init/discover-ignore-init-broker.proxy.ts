import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { fsReadFileIfExistsAdapterProxy } from '../../../adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter.proxy';

// The broker reads '.gitignore' relative to process.cwd(), so this is the whole address.
const GITIGNORE_PATH = PathSegmentStub({ value: '.gitignore' });

export const discoverIgnoreInitBrokerProxy = (): {
  setupGitignore: (params: { contents: FileContents }) => void;
  setupNoGitignore: () => void;
} => {
  const readProxy = fsReadFileIfExistsAdapterProxy();

  return {
    setupGitignore: ({ contents }: { contents: FileContents }): void => {
      readProxy.returnsFor({ filepath: GITIGNORE_PATH, contents });
    },

    setupNoGitignore: (): void => {
      readProxy.missingFor({ filepath: GITIGNORE_PATH });
    },
  };
};
