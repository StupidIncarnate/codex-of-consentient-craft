import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestId,
  QuestStatus,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

// Combine StartOrchestrator method mocks with the questFindQuestPathBroker mock under
// one explicit module-mock factory so both can coexist on @dungeonmaster/orchestrator.
registerModuleMock({
  module: '@dungeonmaster/orchestrator',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/orchestrator'),
    StartOrchestrator: {
      addGuild: jest.fn(),
      addQuest: jest.fn(),
      browseDirectories: jest.fn(),
      getGuild: jest.fn(),
      getQuest: jest.fn(),
      getQuestStatus: jest.fn(),
      listGuilds: jest.fn(),
      listQuests: jest.fn(),
      loadQuest: jest.fn(),
      modifyQuest: jest.fn(),
      pauseQuest: jest.fn(),
      abandonQuest: jest.fn(),
      recoverActiveQuests: jest.fn(),
      removeGuild: jest.fn(),
      replayChatHistory: jest.fn(),
      startChat: jest.fn(),
      startDesignChat: jest.fn(),
      startQuest: jest.fn(),
      stopAllChats: jest.fn(),
      stopChat: jest.fn(),
      updateGuild: jest.fn(),
      clarifyAnswer: jest.fn(),
      resumeQuest: jest.fn(),
      deleteQuest: jest.fn(),
    },
    questFindQuestPathBroker: jest.fn(),
  }),
});

import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { orchestratorResumeQuestAdapterProxy } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter.proxy';
import { orchestratorStartChatAdapterProxy } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter.proxy';
import { QuestChatResponder } from './quest-chat-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestChatResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: QuestId; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: QuestId;
    guildId: GuildId;
    questPath: AbsoluteFilePath;
  }) => void;
  setupFindQuestPathError: (params: { questId: QuestId; error: Error }) => void;
  setupStartChat: (params: { guildId: GuildId; chatProcessId: ProcessId }) => void;
  setupStartChatError: (params: { guildId: GuildId; message: string }) => void;
  setupResumeQuest: (params: {
    questId: QuestId;
    resumed: boolean;
    restoredStatus: QuestStatus;
  }) => void;
  setupResumeQuestError: (params: { questId: QuestId; message: string }) => void;
  getResumeQuestCalls: () => readonly unknown[];
  assertResumeCalledBeforeStartChat: () => boolean;
  callResponder: typeof QuestChatResponder;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const startChatProxy = orchestratorStartChatAdapterProxy();
  const resumeProxy = orchestratorResumeQuestAdapterProxy();

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ questId: quest.id, quest });
    },
    setupQuestLoadError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      loadProxy.throws({ questId, error });
    },
    setupFindQuestPath: ({
      questId,
      guildId,
      questPath,
    }: {
      questId: QuestId;
      guildId: GuildId;
      questPath: AbsoluteFilePath;
    }): void => {
      findPathProxy.returns({ questId, guildId, questPath });
    },
    setupFindQuestPathError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      findPathProxy.throws({ questId, error });
    },
    setupStartChat: ({
      guildId,
      chatProcessId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
    }): void => {
      startChatProxy.returns({ guildId, chatProcessId });
    },
    setupStartChatError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      startChatProxy.throws({ guildId, error: new Error(message) });
    },
    // Explicit staging for the "quest was paused" path — resumeQuest genuinely gets called for
    // that questId before start-chat, so the mock must be told what it resolves to instead of
    // leaning on an implicit default.
    setupResumeQuest: ({
      questId,
      resumed,
      restoredStatus,
    }: {
      questId: QuestId;
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      resumeProxy.returns({ questId, resumed, restoredStatus });
    },
    setupResumeQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      resumeProxy.throws({ questId, error: new Error(message) });
    },
    getResumeQuestCalls: (): readonly unknown[] => {
      const resumeFn = StartOrchestrator.resumeQuest as jest.Mock;
      return resumeFn.mock.calls.map(([firstArg]: readonly unknown[]) => firstArg);
    },
    assertResumeCalledBeforeStartChat: (): boolean => {
      const resumeFn = StartOrchestrator.resumeQuest as jest.Mock;
      const startChatFn = StartOrchestrator.startChat as jest.Mock;
      const [resumeOrder] = resumeFn.mock.invocationCallOrder;
      const [startChatOrder] = startChatFn.mock.invocationCallOrder;
      if (resumeOrder === undefined || startChatOrder === undefined) {
        return false;
      }
      return resumeOrder < startChatOrder;
    },
    callResponder: QuestChatResponder,
  };
};
