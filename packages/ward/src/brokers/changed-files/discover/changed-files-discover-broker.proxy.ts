import { gitDiffFilesBrokerProxy } from '../../git/diff-files/git-diff-files-broker.proxy';

export const changedFilesDiscoverBrokerProxy = (): {
  setupWithChangedFiles: (params: { diffOutput: string }) => void;
  setupNoChanges: () => void;
} => {
  const diffProxy = gitDiffFilesBrokerProxy();

  return {
    setupWithChangedFiles: ({ diffOutput }: { diffOutput: string }): void => {
      diffProxy.setupWithMainBranch({ diffOutput });
    },

    setupNoChanges: (): void => {
      diffProxy.setupWithMainBranch({ diffOutput: '' });
    },
  };
};
