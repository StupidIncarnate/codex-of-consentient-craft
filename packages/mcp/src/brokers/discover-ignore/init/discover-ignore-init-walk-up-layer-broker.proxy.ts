import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { dirname, join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

const GITIGNORE_FILENAME = '.gitignore';

export const discoverIgnoreInitWalkUpLayerBrokerProxy = (): {
  setupGitignoreAt: (params: { dirPath: string; contents: string }) => void;
  setupGitignoreFoundInParent: (params: {
    startPath: string;
    gitignoreDir: string;
    contents: string;
  }) => void;
  setupNoGitignore: (params?: { startPath?: string }) => void;
  setupProjectBoundaryAt: (params: { startPath: string; boundaryDir: string }) => void;
} => {
  const readGateway = readFileIfExistsProxy();

  const stageMissingUntil = ({ dirPath, stopAt }: { dirPath: string; stopAt?: string }): void => {
    if (stopAt !== undefined && dirPath === stopAt) {
      return;
    }
    const gitignorePath = join(dirPath, GITIGNORE_FILENAME);
    const configPath = join(dirPath, locationsStatics.repoRoot.config);
    readGateway.missing({ path: gitignorePath });
    readGateway.missing({ path: configPath });
    const parent = dirname(dirPath);
    if (parent === dirPath) {
      return;
    }
    stageMissingUntil(stopAt === undefined ? { dirPath: parent } : { dirPath: parent, stopAt });
  };

  return {
    setupGitignoreAt: ({ dirPath, contents }: { dirPath: string; contents: string }): void => {
      const gitignorePath = join(dirPath, GITIGNORE_FILENAME);
      readGateway.returns({ path: gitignorePath, contents });
    },

    setupGitignoreFoundInParent: ({
      startPath,
      gitignoreDir,
      contents,
    }: {
      startPath: string;
      gitignoreDir: string;
      contents: string;
    }): void => {
      stageMissingUntil({ dirPath: startPath, stopAt: gitignoreDir });
      const gitignorePath = join(gitignoreDir, GITIGNORE_FILENAME);
      readGateway.returns({ path: gitignorePath, contents });
    },

    setupNoGitignore: ({ startPath }: { startPath?: string } = {}): void => {
      stageMissingUntil({ dirPath: startPath ?? '.' });
    },

    setupProjectBoundaryAt: ({
      startPath,
      boundaryDir,
    }: {
      startPath: string;
      boundaryDir: string;
    }): void => {
      stageMissingUntil({ dirPath: startPath, stopAt: boundaryDir });
      const configPath = join(boundaryDir, locationsStatics.repoRoot.config);
      const gitignorePath = join(boundaryDir, GITIGNORE_FILENAME);
      readGateway.missing({ path: gitignorePath });
      readGateway.returns({ path: configPath, contents: '{}' });
    },
  };
};
