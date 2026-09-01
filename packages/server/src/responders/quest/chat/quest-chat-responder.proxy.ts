import { writeFile } from 'fs/promises';
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestId,
  QuestStatus,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

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
import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
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
  getStartChatCallArgs: (params: { guildId: GuildId }) => unknown;
  getStartChatCallCount: () => unknown;
  setupPastedImageHome: (params: { homePath: string }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  getWrittenPayloadsInOrder: () => unknown[];
  callResponder: typeof QuestChatResponder;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const startChatProxy = orchestratorStartChatAdapterProxy();
  const resumeProxy = orchestratorResumeQuestAdapterProxy();
  // pastedImagePersistBroker is APPLICATION code — it runs REAL. This proxy only mocks the npm
  // boundary underneath it (mkdir, writeFile, randomUUID, homedir), composed exactly the way the
  // broker's own test does.
  const persistProxy = pastedImagePersistBrokerProxy();
  // Extra READ-ONLY handle on the same npm `writeFile` persistProxy's own fsWriteFileBase64AdapterProxy
  // already stages. It never calls .calledWith, only .callsMatching, so it cannot collide with that
  // staging — same pattern pastedImagePersistBrokerProxy itself uses for its writeCallCount(). This is
  // what lets a test see every write's raw base64 payload in invocation order without first computing
  // each write's absolute destination path.
  const writeCallsHandle = registerMock({ fn: writeFile });

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
      const resumeFn = StartOrchestrator.resumeQuest as jest.MockedFunction<
        typeof StartOrchestrator.resumeQuest
      >;
      return resumeFn.mock.calls.map(([firstArg]) => firstArg);
    },
    assertResumeCalledBeforeStartChat: (): boolean => {
      const resumeFn = StartOrchestrator.resumeQuest as jest.MockedFunction<
        typeof StartOrchestrator.resumeQuest
      >;
      const startChatFn = StartOrchestrator.startChat as jest.MockedFunction<
        typeof StartOrchestrator.startChat
      >;
      const [resumeOrder] = resumeFn.mock.invocationCallOrder;
      const [startChatOrder] = startChatFn.mock.invocationCallOrder;
      if (resumeOrder === undefined || startChatOrder === undefined) {
        return false;
      }
      return resumeOrder < startChatOrder;
    },
    getStartChatCallArgs: ({ guildId }: { guildId: GuildId }): unknown =>
      startChatProxy.getLastCalledArgs({ guildId }),
    getStartChatCallCount: (): unknown => {
      const startChatFn = StartOrchestrator.startChat as jest.MockedFunction<
        typeof StartOrchestrator.startChat
      >;
      return startChatFn.mock.calls.length;
    },
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      persistProxy.setupHome({ homePath });
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      persistProxy.stageImageIds({ ids });
    },
    // Raw base64 payload per write, in the order fs actually received them — the images.map()
    // callback in pastedImagePersistBroker starts each write synchronously in input order (see
    // that broker's own proxy for why), so this is the posted order too.
    getWrittenPayloadsInOrder: (): unknown[] =>
      writeCallsHandle.callsMatching([]).map((call) => call[1]),
    callResponder: QuestChatResponder,
  };
};
