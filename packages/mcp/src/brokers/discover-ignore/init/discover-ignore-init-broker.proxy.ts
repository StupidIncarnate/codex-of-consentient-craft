import { discoverIgnoreInitWalkUpLayerBrokerProxy } from './discover-ignore-init-walk-up-layer-broker.proxy';

export const discoverIgnoreInitBrokerProxy = (): {
  setupGitignore: (params: { contents: string }) => void;
  setupNoGitignore: () => void;
  setupGitignoreAt: (params: { dirPath: string; contents: string }) => void;
  setupGitignoreFoundInParent: (params: {
    startPath: string;
    gitignoreDir: string;
    contents: string;
  }) => void;
} => {
  const walkUpProxy = discoverIgnoreInitWalkUpLayerBrokerProxy();

  return {
    setupGitignore: ({ contents }: { contents: string }): void => {
      walkUpProxy.setupGitignoreAt({ dirPath: '.', contents });
    },

    setupNoGitignore: (): void => {
      walkUpProxy.setupNoGitignore();
    },

    setupGitignoreAt: ({ dirPath, contents }: { dirPath: string; contents: string }): void => {
      walkUpProxy.setupGitignoreAt({ dirPath, contents });
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
      walkUpProxy.setupGitignoreFoundInParent({ startPath, gitignoreDir, contents });
    },
  };
};
