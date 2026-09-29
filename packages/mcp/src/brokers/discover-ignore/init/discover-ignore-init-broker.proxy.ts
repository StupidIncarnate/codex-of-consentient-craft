import { PathSegmentStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

// The broker reads '.gitignore' relative to process.cwd(), so this is the whole address.
const GITIGNORE_PATH = PathSegmentStub({ value: '.gitignore' });

export const discoverIgnoreInitBrokerProxy = (): {
  setupGitignore: (params: { contents: FileContents }) => void;
  setupNoGitignore: () => void;
} => {
  const readGateway = readFileIfExistsProxy();

  return {
    setupGitignore: ({ contents }: { contents: FileContents }): void => {
      readGateway.returns({ path: GITIGNORE_PATH, contents });
    },

    setupNoGitignore: (): void => {
      readGateway.missing({ path: GITIGNORE_PATH });
    },
  };
};
