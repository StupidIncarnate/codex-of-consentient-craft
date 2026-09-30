import { checkoutProxy } from '#gateway/bin/git/checkout/checkout.proxy';
import { currentBranchProxy } from '#gateway/bin/git/current-branch/current-branch.proxy';

const extractArgs = (call: readonly unknown[]): readonly unknown[] => {
  const [first] = call;
  if (typeof first === 'object' && first !== null && 'args' in first) {
    return Array.isArray(first.args) ? first.args : [];
  }
  return [];
};

export const worktreeResumeRestoreBrokerProxy = (): {
  setupOnBranch: (params: { branchName: string }) => void;
  setupDrifted: (params: { currentBranchName: string }) => void;
  setupDetachedHead: () => void;
  setupRevParseFails: (params: { output: string }) => void;
  setupCheckoutSucceeds: (params: { branchName: string }) => void;
  setupCheckoutFails: (params: { branchName: string; output: string }) => void;
  setupBranchWithTrailingWarning: (params: { branchName: string; warning: string }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const currentBranch = currentBranchProxy();
  const checkout = checkoutProxy();

  return {
    setupOnBranch: ({ branchName }: { branchName: string }): void => {
      currentBranch.setupBranch({ branch: branchName });
    },

    setupDrifted: ({ currentBranchName }: { currentBranchName: string }): void => {
      currentBranch.setupBranch({ branch: currentBranchName });
    },

    setupDetachedHead: (): void => {
      currentBranch.setupDetached();
    },

    setupRevParseFails: ({ output }: { output: string }): void => {
      currentBranch.setupFailure({ exitCode: 128, output });
    },

    setupCheckoutSucceeds: ({ branchName }: { branchName: string }): void => {
      checkout.setupResult({ branchName: branchName, exitCode: 0, output: '' });
    },

    setupCheckoutFails: ({ branchName, output }: { branchName: string; output: string }): void => {
      checkout.setupResult({ branchName: branchName, exitCode: 128, output });
    },

    setupBranchWithTrailingWarning: ({
      branchName,
      warning,
    }: {
      branchName: string;
      warning: string;
    }): void => {
      currentBranch.setupBranch({ branch: `${branchName}\n${warning}` });
    },

    getSpawnedArgsList: (): readonly unknown[] => [
      ...currentBranch.getCallsFor().map(extractArgs),
      ...checkout.getCallsFor({ branchName: () => true }).map(extractArgs),
    ],
  };
};
