import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questRepoRootBrokerProxy } from '../repo-root/quest-repo-root-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;

export const questCwdResolveBrokerProxy = (): {
  setupWorktreePresent: (params: { quest: Quest }) => void;
  setupWorktreeMissing: (params: { quest: Quest }) => void;
  setupSessionRow: (params: { quest: Quest }) => void;
  setupLegacyQuest: (params: { quest: Quest; repoRoot: RepoRootCwd }) => void;
  setupQuestNotFound: () => void;
} => {
  const getProxy = questGetBrokerProxy();
  // Only exercised by setupLegacyQuest below, but constructed here so every scenario shares
  // the same pathExists/questFindQuestPathBroker mocks this composes internally.
  const repoRootProxy = questRepoRootBrokerProxy();
  const accessibleProxy = pathExistsProxy();

  return {
    setupWorktreePresent: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      accessibleProxy.present({ path: filePathContract.parse(quest.worktreePath) });
    },

    setupWorktreeMissing: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      accessibleProxy.missing({ path: filePathContract.parse(quest.worktreePath) });
    },

    // Stages the quest read and NOTHING ELSE. The absent pathExists staging is the
    // assertion: a recorded session row is served without the worktree probe, so a broker that
    // probed anyway would hit an unstaged mock and throw rather than pass quietly.
    setupSessionRow: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    // A legacy (no-worktreePath) quest is looked up TWICE by the broker under test: once by
    // questGetBroker (to read the quest itself) and once more by questRepoRootBroker's own
    // internal questFindQuestPathBroker call (to resolve the guild that owns it). Staging
    // both child proxies' setupQuestFound queues enough one-shot file reads for both lookups.
    setupLegacyQuest: ({ quest, repoRoot }: { quest: Quest; repoRoot: RepoRootCwd }): void => {
      getProxy.setupQuestFound({ quest });
      repoRootProxy.setupQuestFound({ quest });
      repoRootProxy.setupResolveSuccess({ repoRoot });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
  };
};
