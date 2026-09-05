import { gitDiffCommittedBrokerProxy } from '../../git/diff-committed/git-diff-committed-broker.proxy';
import { gitDiffUncommittedBrokerProxy } from '../../git/diff-uncommitted/git-diff-uncommitted-broker.proxy';

export const commandRunLayerGitScopeBrokerProxy = (): {
  setupCommittedFiles: (params: { diffOutput: string }) => void;
  setupUncommittedFiles: (params: { trackedOutput: string; untrackedOutput: string }) => void;
} => {
  const committedProxy = gitDiffCommittedBrokerProxy();
  const uncommittedProxy = gitDiffUncommittedBrokerProxy();

  return {
    setupCommittedFiles: ({ diffOutput }: { diffOutput: string }): void => {
      committedProxy.setupWithOriginMain({ diffOutput });
    },

    setupUncommittedFiles: ({
      trackedOutput,
      untrackedOutput,
    }: {
      trackedOutput: string;
      untrackedOutput: string;
    }): void => {
      uncommittedProxy.setupWorkingTree({ trackedOutput, untrackedOutput });
    },
  };
};
