/**
 * PURPOSE: Proxy for worktreeDiscardBroker. Composes gitWorktreeRemoveAdapterProxy and
 * branchDeleteProxy to mock git operations for worktree removal and branch deletion.
 *
 * USAGE:
 * const proxy = worktreeDiscardBrokerProxy();
 * proxy.setupBothSucceed({ worktreePath, branchName });
 * const result = await worktreeDiscardBroker({ repoRoot, worktreePath, branchName });
 */

import type { AbsoluteFilePath, QuestBranchName } from '@dungeonmaster/shared/contracts';

import { branchDeleteProxy } from '#gateway/bin/git/branch-delete/branch-delete.proxy';
import { gitWorktreeRemoveAdapterProxy } from '../../../adapters/git/worktree-remove/git-worktree-remove-adapter.proxy';

const extractArgs = (call: readonly unknown[]): readonly unknown[] => {
  const [first] = call;
  if (typeof first === 'object' && first !== null && 'args' in first) {
    return Array.isArray(first.args) ? first.args : [];
  }
  return [];
};

export const worktreeDiscardBrokerProxy = (): {
  setupBothSucceed: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
  }) => void;
  setupRemoveFails: (params: { worktreePath: AbsoluteFilePath; output: string }) => void;
  setupDeleteFails: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    output: string;
  }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const removeProxy = gitWorktreeRemoveAdapterProxy();
  const deleteProxy = branchDeleteProxy();
  const state: { worktreePath?: AbsoluteFilePath } = {};

  return {
    setupBothSucceed: ({
      worktreePath,
      branchName,
    }: {
      worktreePath: AbsoluteFilePath;
      branchName: QuestBranchName;
    }): void => {
      state.worktreePath = worktreePath;
      removeProxy.setupSuccess();
      deleteProxy.setupResult({ branchName: String(branchName), exitCode: 0, output: '' });
    },

    setupRemoveFails: ({
      worktreePath,
      output,
    }: {
      worktreePath: AbsoluteFilePath;
      output: string;
    }): void => {
      state.worktreePath = worktreePath;
      removeProxy.setupFailure({ output });
    },

    setupDeleteFails: ({
      worktreePath,
      branchName,
      output,
    }: {
      worktreePath: AbsoluteFilePath;
      branchName: QuestBranchName;
      output: string;
    }): void => {
      state.worktreePath = worktreePath;
      removeProxy.setupSuccess();
      deleteProxy.setupResult({ branchName: String(branchName), exitCode: 128, output });
    },

    getSpawnedArgsList: (): readonly unknown[] => {
      const deleteCalls = deleteProxy
        .getCallsFor({ branchName: (arg: unknown): boolean => typeof arg === 'string' })
        .map(extractArgs);

      if (state.worktreePath === undefined) {
        return deleteCalls;
      }

      const removeArgs = ['worktree', 'remove', '--force', state.worktreePath];
      return [removeArgs, ...deleteCalls];
    },
  };
};
