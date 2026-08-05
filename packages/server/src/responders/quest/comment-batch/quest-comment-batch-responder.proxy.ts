import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestId,
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
      commentBatch: jest.fn(),
      resumeQuest: jest.fn(),
      deleteQuest: jest.fn(),
    },
    questFindQuestPathBroker: jest.fn(),
  }),
});

import { orchestratorCommentBatchAdapterProxy } from '../../../adapters/orchestrator/comment-batch/orchestrator-comment-batch-adapter.proxy';
import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { QuestCommentBatchResponder } from './quest-comment-batch-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestCommentBatchResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: QuestId; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: QuestId;
    guildId: GuildId;
    questPath: AbsoluteFilePath;
  }) => void;
  setupCommentBatch: (params: {
    questId: QuestId;
    chatProcessId: ProcessId;
    deliveredMessage: string;
  }) => void;
  setupCommentBatchError: (params: { questId: QuestId; message: string }) => void;
  getDeliveredBatch: (params: { questId: QuestId }) => unknown;
  getDeliveryAttempts: (params: { questId: QuestId }) => unknown[];
  callResponder: typeof QuestCommentBatchResponder;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const commentBatchProxy = orchestratorCommentBatchAdapterProxy();

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
    // `deliveredMessage` is the markdown the orchestrator handed the agent. The responder echoes it
    // in the 200 body, so a test names it here and asserts the same text comes back out.
    setupCommentBatch: ({
      questId,
      chatProcessId,
      deliveredMessage,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
      deliveredMessage: string;
    }): void => {
      commentBatchProxy.returns({ questId, chatProcessId, message: deliveredMessage });
    },
    setupCommentBatchError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      commentBatchProxy.throws({ questId, error: new Error(message) });
    },
    getDeliveredBatch: ({ questId }: { questId: QuestId }): unknown =>
      commentBatchProxy.getLastCalledArgs({ questId }),
    // Empty array proves no chat process was spawned — the guarantee on the 409 and the
    // persist-failure paths.
    getDeliveryAttempts: ({ questId }: { questId: QuestId }): unknown[] =>
      commentBatchProxy.getCalls({ questId }),
    callResponder: QuestCommentBatchResponder,
  };
};
