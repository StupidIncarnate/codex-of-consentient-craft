/**
 * PURPOSE: Proxy for worktreeDiscardBroker. Composes worktreeRemoveProxy and
 * branchDeleteProxy to mock git operations for worktree removal and branch deletion.
 *
 * USAGE:
 * const proxy = worktreeDiscardBrokerProxy();
 * proxy.setupBothSucceed({ worktreePath, branchName });
 * const result = await worktreeDiscardBroker({ repoRoot, worktreePath, branchName });
 */


import { branchDeleteProxy } from '#gateway/bin/git/branch-delete/branch-delete.proxy';
import { worktreeRemoveProxy } from '#gateway/bin/git/worktree-remove/worktree-remove.proxy';

const extractArgs = (call: readonly unknown[]): readonly unknown[] => {
  const [first] = call;
  if (typeof first === 'object' && first !== null && 'args' in first) {
    return Array.isArray(first.args) ? first.args : [];
  }
  return [];
};

export const worktreeDiscardBrokerProxy = (): {
  setupBothSucceed: (params: {
    worktreePath: string;
    branchName: string;
  }) => void;
  setupRemoveFails: (params: { worktreePath: string; output: string }) => void;
  setupDeleteFails: (params: {
    worktreePath: string;
    branchName: string;
    output: string;
  }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const removeProxy = worktreeRemoveProxy();
  const deleteProxy = branchDeleteProxy();
  const state: { worktreePath?: string } = {};

  return {
    setupBothSucceed: ({
      worktreePath,
      branchName,
    }: {
      worktreePath: string;
      branchName: string;
    }): void => {
      state.worktreePath = worktreePath;
      removeProxy.setupResult({ worktreePath: String(worktreePath), exitCode: 0, output: '' });
      deleteProxy.setupResult({ branchName: String(branchName), exitCode: 0, output: '' });
    },

    setupRemoveFails: ({
      worktreePath,
      output,
    }: {
      worktreePath: string;
      output: string;
    }): void => {
      state.worktreePath = worktreePath;
      removeProxy.setupResult({ worktreePath: String(worktreePath), exitCode: 128, output });
    },

    setupDeleteFails: ({
      worktreePath,
      branchName,
      output,
    }: {
      worktreePath: string;
      branchName: string;
      output: string;
    }): void => {
      state.worktreePath = worktreePath;
      removeProxy.setupResult({ worktreePath: String(worktreePath), exitCode: 0, output: '' });
      deleteProxy.setupResult({ branchName: String(branchName), exitCode: 128, output });
    },

    getSpawnedArgsList: (): readonly unknown[] => {
      const deleteCalls = deleteProxy
        .getCallsFor({ branchName: (arg: unknown): boolean => typeof arg === 'string' })
        .map(extractArgs);

      if (state.worktreePath === undefined) {
        return deleteCalls;
      }

      const removeCalls = removeProxy
        .getCallsFor({ worktreePath: String(state.worktreePath) })
        .map(extractArgs);
      return [...removeCalls, ...deleteCalls];
    },
  };
};
