import { gitDiffFilesBrokerProxy } from '../../git/diff-files/git-diff-files-broker.proxy';
import { gitDiffUnpushedBrokerProxy } from '../../git/diff-unpushed/git-diff-unpushed-broker.proxy';

export const commandRunLayerGitScopeBrokerProxy = (): {
  setupChangedFiles: (params: { diffOutput: string }) => void;
  setupUnpushedFiles: (params: { diffOutput: string }) => void;
} => {
  const changedProxy = gitDiffFilesBrokerProxy();
  const unpushedProxy = gitDiffUnpushedBrokerProxy();

  return {
    setupChangedFiles: ({ diffOutput }: { diffOutput: string }): void => {
      changedProxy.setupWithMainBranch({ diffOutput });
    },

    setupUnpushedFiles: ({ diffOutput }: { diffOutput: string }): void => {
      unpushedProxy.setupWithTrackingBranch({ upstreamRef: 'origin/master', diffOutput });
    },
  };
};
