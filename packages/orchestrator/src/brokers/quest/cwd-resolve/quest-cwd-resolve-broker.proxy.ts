import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questRepoRootBrokerProxy } from '../repo-root/quest-repo-root-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;

export const questCwdResolveBrokerProxy = (): {
  setupWorktreePresent: (params: { quest: Quest }) => void;
  setupWorktreeMissing: (params: { quest: Quest }) => void;
  setupLegacyQuest: (params: { quest: Quest; repoRoot: RepoRootCwd }) => void;
  setupQuestNotFound: () => void;
} => {
  const getProxy = questGetBrokerProxy();
  // Only exercised by setupLegacyQuest below, but constructed here so every scenario shares
  // the same fsIsAccessibleAdapter/questFindQuestPathBroker mocks this composes internally.
  const repoRootProxy = questRepoRootBrokerProxy();
  const accessibleProxy = fsIsAccessibleAdapterProxy();

  return {
    setupWorktreePresent: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      accessibleProxy.resolves({ filePath: filePathContract.parse(quest.worktreePath) });
    },

    setupWorktreeMissing: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      accessibleProxy.rejects({
        filePath: filePathContract.parse(quest.worktreePath),
        error: Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        }),
      });
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
