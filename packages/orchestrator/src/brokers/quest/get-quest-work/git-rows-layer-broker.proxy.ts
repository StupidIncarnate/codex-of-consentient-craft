/**
 * PURPOSE: Proxy for gitRowsLayerBroker. Stages the cwd resolution and, for the reachable-worktree
 * scenario, the two git readings the layer takes there.
 *
 * USAGE:
 * const proxy = gitRowsLayerBrokerProxy();
 * proxy.setupWorktreeMissing({ quest });
 * const rows = await gitRowsLayerBroker({ questId, quest });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { gitLogNameOnlyAdapterProxy } from '../../../adapters/git/log-name-only/git-log-name-only-adapter.proxy';
import { gitWorkingTreeFilesBrokerProxy } from '../../git/working-tree-files/git-working-tree-files-broker.proxy';
import { questCwdResolveBrokerProxy } from '../cwd-resolve/quest-cwd-resolve-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const gitRowsLayerBrokerProxy = (): {
  setupWorktreeMissing: (params: { quest: Quest }) => void;
  setupWorktreePresent: (params: {
    quest: Quest;
    trackedFiles: readonly string[];
    untrackedFiles: readonly string[];
    logOutput: string;
  }) => void;
} => {
  const cwdProxy = questCwdResolveBrokerProxy();
  const workingTreeProxy = gitWorkingTreeFilesBrokerProxy();
  const logProxy = gitLogNameOnlyAdapterProxy();

  return {
    setupWorktreeMissing: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupWorktreeMissing({ quest });
    },

    setupWorktreePresent: ({ quest, trackedFiles, untrackedFiles, logOutput }): void => {
      cwdProxy.setupWorktreePresent({ quest });
      workingTreeProxy.setupWorkingTree({ trackedFiles, untrackedFiles });
      logProxy.setupLogOutput({ output: logOutput });
    },
  };
};
