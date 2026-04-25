import {
  questContract,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { runBlightwardenLayerBroker as bwLayer } from './run-blightwarden-layer-broker';
import { runBlightwardenLayerBrokerProxy } from './run-blightwarden-layer-broker.proxy';
import { runChatLayerBroker as chatLayer } from './run-chat-layer-broker';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';
import { runCodeweaverLayerBroker as cwLayer } from './run-codeweaver-layer-broker';
import { runCodeweaverLayerBrokerProxy } from './run-codeweaver-layer-broker.proxy';
import { runLawbringerLayerBroker as lbLayer } from './run-lawbringer-layer-broker';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';
import { runPathseekerLayerBroker as psLayer } from './run-pathseeker-layer-broker';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';
import { runSiegemasterLayerBroker as smLayer } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';
import { runSpiritmenderLayerBroker as spLayer } from './run-spiritmender-layer-broker';
import { runSpiritmenderLayerBrokerProxy } from './run-spiritmender-layer-broker.proxy';
import { runWardLayerBroker as wardLayer } from './run-ward-layer-broker';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';

type QuestParam = ReturnType<typeof QuestStub>;

const createLayerMocks = (): {
  bwHandle: MockHandle;
  chatHandle: MockHandle;
  cwHandle: MockHandle;
  lbHandle: MockHandle;
  psHandle: MockHandle;
  smHandle: MockHandle;
  spHandle: MockHandle;
  wardHandle: MockHandle;
} => {
  const bwHandle = registerMock({ fn: bwLayer });
  const chatHandle = registerMock({ fn: chatLayer });
  const cwHandle = registerMock({ fn: cwLayer });
  const lbHandle = registerMock({ fn: lbLayer });
  const psHandle = registerMock({ fn: psLayer });
  const smHandle = registerMock({ fn: smLayer });
  const spHandle = registerMock({ fn: spLayer });
  const wardHandle = registerMock({ fn: wardLayer });

  bwHandle.mockResolvedValue(undefined);
  chatHandle.mockResolvedValue(undefined);
  cwHandle.mockResolvedValue(undefined);
  lbHandle.mockResolvedValue(undefined);
  psHandle.mockResolvedValue(undefined);
  smHandle.mockResolvedValue(undefined);
  spHandle.mockResolvedValue(undefined);
  wardHandle.mockResolvedValue(undefined);

  return { bwHandle, chatHandle, cwHandle, lbHandle, psHandle, smHandle, spHandle, wardHandle };
};

const parsePersistedQuests = ({
  modifyProxy,
}: {
  modifyProxy: ReturnType<typeof questModifyBrokerProxy>;
}): readonly Quest[] =>
  modifyProxy
    .getAllPersistedContents()
    .map((content) => questContract.parse(JSON.parse(String(content))));

export const questOrchestrationLoopBrokerProxy = (): {
  setupQuestTerminal: (params: { quest: QuestParam }) => void;
  setupQuestBlocked: (params: { quest: QuestParam }) => void;
  setupQuestNotFound: () => void;
  setupNoReadyItems: (params: { quest: QuestParam }) => void;
  setupChatRoleReady: (params: { quest: QuestParam }) => void;
  setupPathseekerReady: (params: { quest: QuestParam }) => void;
  setupAborted: () => void;
  setupLayerThrows: (params: { quest: QuestParam; error: Error }) => void;
  setupLayerThrowsWithCatchFailure: (params: { quest: QuestParam; error: Error }) => void;
  setupChatDispatchWithRecursion: (params: {
    firstQuest: QuestParam;
    secondQuest: QuestParam;
  }) => void;
  setupRecoveryFromBlocked: (params: {
    blockedQuest: QuestParam;
    terminalQuest: QuestParam;
  }) => void;
  setupChatMutualExclusion: (params: { quest: QuestParam }) => void;
  setupMultipleChatItemsReady: (params: { quest: QuestParam }) => void;
  setupNonChatGroupReady: (params: { quest: QuestParam; terminalQuest: QuestParam }) => void;
  setupMultiRoleGroupsReady: (params: { quest: QuestParam; terminalQuest: QuestParam }) => void;
  setupPartialDepsComplete: (params: { quest: QuestParam }) => void;
  setupFailedDep: (params: { quest: QuestParam }) => void;
  setupAllTerminalNotAllComplete: (params: { quest: QuestParam }) => void;
  setupPreExecutionStatus: (params: { quest: QuestParam }) => void;
  setupItemsStillRunning: (params: { quest: QuestParam }) => void;
  setupSingleDispatch: (params: { quest: QuestParam; terminalQuest: QuestParam }) => void;
  setupModifyReject: (params: { error: Error }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Quest[];
  findPersistedWorkItem: (params: {
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => WorkItem | undefined;
  wasChatLayerCalled: () => boolean;
  wasCodeweaverLayerCalled: () => boolean;
  wasOnAgentEntryPassedTo: (params: {
    role:
      | 'chat'
      | 'pathseeker'
      | 'codeweaver'
      | 'ward'
      | 'siegemaster'
      | 'lawbringer'
      | 'blightwarden'
      | 'spiritmender';
  }) => boolean;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  configProxy.setupConfigResolved({ config: configProxy.makeRealConfig() });
  runChatLayerBrokerProxy();
  runPathseekerLayerBrokerProxy();
  runCodeweaverLayerBrokerProxy();
  runWardLayerBrokerProxy();
  runSiegemasterLayerBrokerProxy();
  runLawbringerLayerBrokerProxy();
  runBlightwardenLayerBrokerProxy();
  runSpiritmenderLayerBrokerProxy();

  const handles = createLayerMocks();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

  return {
    setupQuestTerminal: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestBlocked: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupNoReadyItems: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupChatRoleReady: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupPathseekerReady: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupAborted: (): void => {
      // No setup needed — abort is checked before quest load
    },

    setupLayerThrows: ({ quest, error }: { quest: QuestParam; error: Error }): void => {
      // Loop: initial quest load
      getProxy.setupQuestFound({ quest });
      // Loop: mark items in_progress
      modifyProxy.setupQuestFound({ quest });
      // Loop catch: mark items failed
      modifyProxy.setupQuestFound({ quest });
      // Loop catch: re-fetch quest
      getProxy.setupQuestFound({ quest });
      // Loop catch: update quest status
      modifyProxy.setupQuestFound({ quest });

      handles.psHandle.mockRejectedValueOnce(error);
    },

    setupLayerThrowsWithCatchFailure: ({
      quest,
      error,
    }: {
      quest: QuestParam;
      error: Error;
    }): void => {
      // Loop: initial quest load
      getProxy.setupQuestFound({ quest });
      // Loop: mark items in_progress
      modifyProxy.setupQuestFound({ quest });

      handles.psHandle.mockRejectedValueOnce(error);

      // Catch block: no modify mocks queued, so questModifyBroker returns { success: false }
      // Original error still propagates due to inner try/catch in catch block
    },

    setupChatDispatchWithRecursion: ({
      firstQuest,
      secondQuest,
    }: {
      firstQuest: QuestParam;
      secondQuest: QuestParam;
    }): void => {
      // First iteration: load quest with chat ready
      getProxy.setupQuestFound({ quest: firstQuest });
      // Mark chat item in_progress
      modifyProxy.setupQuestFound({ quest: firstQuest });

      // Chat layer resolves (registerMock auto-returns undefined = success)

      // Recursion: load quest with second chat ready but no userMessage
      getProxy.setupQuestFound({ quest: secondQuest });
      modifyProxy.setupQuestFound({ quest: secondQuest });
    },

    setupRecoveryFromBlocked: ({
      blockedQuest,
      terminalQuest,
    }: {
      blockedQuest: QuestParam;
      terminalQuest: QuestParam;
    }): void => {
      // First iteration: load blocked quest that has ready items
      getProxy.setupQuestFound({ quest: blockedQuest });
      // Mark ready item in_progress
      modifyProxy.setupQuestFound({ quest: blockedQuest });

      // Layer resolves (registerMock auto-returns undefined = success)

      // Recursion: load terminal quest
      getProxy.setupQuestFound({ quest: terminalQuest });
      // Terminal state may modify quest status
      modifyProxy.setupQuestFound({ quest: terminalQuest });
    },

    setupChatMutualExclusion: ({ quest }: { quest: QuestParam }): void => {
      // Chat in_progress + another chat pending => should NOT dispatch pending one
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupMultipleChatItemsReady: ({ quest }: { quest: QuestParam }): void => {
      // Multiple chat items ready => only first dispatched
      getProxy.setupQuestFound({ quest });
      // Mark first chat item in_progress
      modifyProxy.setupQuestFound({ quest });
      // Recursion: load quest after first chat completes (no userMessage => returns)
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupNonChatGroupReady: ({
      quest,
      terminalQuest,
    }: {
      quest: QuestParam;
      terminalQuest: QuestParam;
    }): void => {
      // Non-chat items ready => all dispatched together
      getProxy.setupQuestFound({ quest });
      // Mark items in_progress
      modifyProxy.setupQuestFound({ quest });
      // Recursion: load terminal quest
      getProxy.setupQuestFound({ quest: terminalQuest });
      modifyProxy.setupQuestFound({ quest: terminalQuest });
    },

    setupMultiRoleGroupsReady: ({
      quest,
      terminalQuest,
    }: {
      quest: QuestParam;
      terminalQuest: QuestParam;
    }): void => {
      // Multiple role groups ready => only first group dispatched
      getProxy.setupQuestFound({ quest });
      // Mark first group in_progress
      modifyProxy.setupQuestFound({ quest });
      // Recursion: load quest with first group in_progress (no new ready items)
      getProxy.setupQuestFound({ quest: terminalQuest });
    },

    setupPartialDepsComplete: ({ quest }: { quest: QuestParam }): void => {
      // Item with partially satisfied deps => no ready items, but in_progress exists
      getProxy.setupQuestFound({ quest });
    },

    setupFailedDep: ({ quest }: { quest: QuestParam }): void => {
      // Item with failed dep => quest blocked
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupAllTerminalNotAllComplete: ({ quest }: { quest: QuestParam }): void => {
      // All terminal but not all complete => quest terminal, status updated
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupPreExecutionStatus: ({ quest }: { quest: QuestParam }): void => {
      // Pre-execution status preserved when chat fails
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupItemsStillRunning: ({ quest }: { quest: QuestParam }): void => {
      // Mix of in_progress and failed => no ready items, return without dispatching
      getProxy.setupQuestFound({ quest });
    },

    setupSingleDispatch: ({
      quest,
      terminalQuest,
    }: {
      quest: QuestParam;
      terminalQuest: QuestParam;
    }): void => {
      // Single item ready => dispatch and check in_progress marking
      getProxy.setupQuestFound({ quest });
      // Mark item in_progress
      modifyProxy.setupQuestFound({ quest });
      // Recursion: load terminal quest
      getProxy.setupQuestFound({ quest: terminalQuest });
      modifyProxy.setupQuestFound({ quest: terminalQuest });
    },

    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getAllPersistedQuests: (): readonly Quest[] => parsePersistedQuests({ modifyProxy }),

    findPersistedWorkItem: ({
      workItemId,
      status,
    }: {
      workItemId: QuestWorkItemId;
      status: WorkItemStatus;
    }): WorkItem | undefined => {
      const quests = parsePersistedQuests({ modifyProxy });
      for (const quest of quests) {
        const match = quest.workItems.find((wi) => wi.id === workItemId && wi.status === status);
        if (match) {
          return match;
        }
      }
      return undefined;
    },

    wasChatLayerCalled: (): boolean => handles.chatHandle.mock.calls.length > 0,

    wasCodeweaverLayerCalled: (): boolean => handles.cwHandle.mock.calls.length > 0,

    wasOnAgentEntryPassedTo: ({
      role,
    }: {
      role:
        | 'chat'
        | 'pathseeker'
        | 'codeweaver'
        | 'ward'
        | 'siegemaster'
        | 'lawbringer'
        | 'blightwarden'
        | 'spiritmender';
    }): boolean => {
      const getCalls = (): readonly unknown[][] => {
        if (role === 'chat') return handles.chatHandle.mock.calls;
        if (role === 'pathseeker') return handles.psHandle.mock.calls;
        if (role === 'codeweaver') return handles.cwHandle.mock.calls;
        if (role === 'ward') return handles.wardHandle.mock.calls;
        if (role === 'siegemaster') return handles.smHandle.mock.calls;
        if (role === 'lawbringer') return handles.lbHandle.mock.calls;
        if (role === 'blightwarden') return handles.bwHandle.mock.calls;
        return handles.spHandle.mock.calls;
      };
      const calls = getCalls();
      if (calls.length === 0) return false;
      const firstCallArgs = calls[0]?.[0];
      return (
        firstCallArgs !== null &&
        typeof firstCallArgs === 'object' &&
        'onAgentEntry' in firstCallArgs
      );
    },
  };
};
