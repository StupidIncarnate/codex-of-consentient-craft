import {
  questContract,
  RepoRootCwdStub,
  type ErrorMessage,
  type QuestStub,
  type QuestWorkItemId,
  type RepoRootCwd,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { agentLaunchBrokerProxy } from '../../agent/launch/agent-launch-broker.proxy';
import { questCwdResolveBrokerProxy } from '../cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

// Legacy (no-worktreePath) quests resolve their cwd from the guild's repo root. The actual
// value is opaque to every scenario below except the one that asserts on it directly.
const DEFAULT_REPO_ROOT = RepoRootCwdStub({ value: '/project' });

export const runChatLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupSpawnSuccess: (params: { quest: Quest; lines: readonly string[] }) => void;
  setupSpawnThrow: (params: { quest: Quest }) => void;
  setupSpawnNonZeroExit: (params: { quest: Quest }) => void;
  setupWorktreeFound: (params: { quest: Quest }) => void;
  setupWorktreeMissing: (params: { quest: Quest }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getLastPersistedWorkItemErrorMessage: (params: {
    workItemId: QuestWorkItemId;
  }) => ErrorMessage | undefined;
} => {
  const modifyProxy = questModifyBrokerProxy();
  const launchProxy = agentLaunchBrokerProxy();
  // run-chat-layer-broker reads the resolved quest's cwd via questCwdResolveBroker; loading
  // its proxy wires up the questGetBroker/questRepoRootBroker/fsIsAccessibleAdapter mocks that
  // decide the 'worktree' | 'repo-root' | 'missing-worktree' outcome.
  const cwdProxy = questCwdResolveBrokerProxy();

  // NOTE ON STAGING ORDER: questGetBrokerProxy/questRepoRootBrokerProxy/questModifyBrokerProxy
  // all compose questFindQuestPathBrokerProxy, whose pathJoin/readFile stand-ins for
  // zero-argument npm calls (path.join, readFile with no caller-known address) are ONE-SHOT
  // QUEUES consumed in registration order, shared across every composing proxy in the test —
  // not argument-addressed. runChatLayerBroker calls questCwdResolveBroker (which composes
  // questGetBroker, and for a legacy quest questRepoRootBroker) BEFORE questModifyBroker's own
  // find+load+persist chain, so cwdProxy MUST be staged before modifyProxy here — staging them
  // in the other order shifts questCwdResolveBroker's real calls onto modifyProxy's
  // differently-valued persist-path queue entries, producing "Quest not found".
  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupLegacyQuest({ quest, repoRoot: DEFAULT_REPO_ROOT });
      modifyProxy.setupQuestFound({ quest });
      launchProxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });
    },

    setupSpawnSuccess: ({ quest, lines }: { quest: Quest; lines: readonly string[] }): void => {
      cwdProxy.setupLegacyQuest({ quest, repoRoot: DEFAULT_REPO_ROOT });
      modifyProxy.setupQuestFound({ quest });
      launchProxy.setupSpawnAndEmitLines({ lines, exitCode: 0 });
    },

    setupSpawnThrow: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupLegacyQuest({ quest, repoRoot: DEFAULT_REPO_ROOT });
      modifyProxy.setupQuestFound({ quest });
      launchProxy.setupSpawnThrow({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnNonZeroExit: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupLegacyQuest({ quest, repoRoot: DEFAULT_REPO_ROOT });
      modifyProxy.setupQuestFound({ quest });
      launchProxy.setupSpawnAndEmitLines({ lines: [], exitCode: 1 });
    },

    setupWorktreeFound: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupWorktreePresent({ quest });
      modifyProxy.setupQuestFound({ quest });
      launchProxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });
    },

    // Only questModifyBroker's failure-path write needs staging here — questCwdResolveBroker
    // throws before agentLaunchBroker is ever reached, so no spawn mock is needed.
    setupWorktreeMissing: ({ quest }: { quest: Quest }): void => {
      cwdProxy.setupWorktreeMissing({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    getSpawnedArgs: (): unknown => launchProxy.getSpawnedArgs(),

    getSpawnedOptions: (): unknown => launchProxy.getSpawnedOptions(),

    getSpawnedCwd: (): RepoRootCwd | undefined => launchProxy.getSpawnedCwd(),

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length === 0) {
        return undefined;
      }
      const raw = persisted[persisted.length - 1];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const lastQuest = questContract.parse(parsed);
      const item = lastQuest.workItems.find((wi) => wi.id === workItemId);
      return item?.status;
    },

    getLastPersistedWorkItemErrorMessage: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): ErrorMessage | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length === 0) {
        return undefined;
      }
      const raw = persisted[persisted.length - 1];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const lastQuest = questContract.parse(parsed);
      const item = lastQuest.workItems.find((wi) => wi.id === workItemId);
      return item?.errorMessage;
    },
  };
};
