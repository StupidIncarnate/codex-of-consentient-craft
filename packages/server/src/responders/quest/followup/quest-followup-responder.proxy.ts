import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type {
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
      startFollowupChat: jest.fn(),
      startQuest: jest.fn(),
      stopAllChats: jest.fn(),
      stopChat: jest.fn(),
      stopFollowupChat: jest.fn(),
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
import { orchestratorStartFollowupChatAdapterProxy } from '../../../adapters/orchestrator/start-followup-chat/orchestrator-start-followup-chat-adapter.proxy';
import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { QuestFollowupResponder } from './quest-followup-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const QuestFollowupResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: QuestId; error: Error }) => void;
  setupFindQuestPath: (params: { questId: QuestId; guildId: GuildId }) => void;
  setupStartFollowupChat: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupStartFollowupChatError: (params: { questId: QuestId; error: Error }) => void;
  getStartFollowupChatCalls: () => readonly unknown[];
  setupPastedImageHome: (params: { homePath: string }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  getPastedImageWrittenPayloadFor: (params: { filePath: string }) => unknown;
  getPastedImageWriteCallCount: () => unknown;
  callResponder: typeof QuestFollowupResponder;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const startFollowupChatProxy = orchestratorStartFollowupChatAdapterProxy();
  // The persist broker is APPLICATION code and runs REAL here — this proxy only mocks the npm
  // boundary underneath it (mkdir, writeFile, randomUUID, homedir). Its methods are re-exposed
  // below under semantic names scoped to "pasted image", never handed back as a raw child proxy.
  const pastedImageProxy = pastedImagePersistBrokerProxy();

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ questId: quest.id, quest });
    },
    setupQuestLoadError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      loadProxy.throws({ questId, error });
    },
    setupFindQuestPath: ({ questId, guildId }: { questId: QuestId; guildId: GuildId }): void => {
      findPathProxy.returns({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: `/quests/${questId}` }),
      });
    },
    setupStartFollowupChat: ({
      questId,
      chatProcessId,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
    }): void => {
      startFollowupChatProxy.returns({ questId, chatProcessId });
    },
    setupStartFollowupChatError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      startFollowupChatProxy.throws({ questId, error });
    },
    // Every call the adapter received, so a rejected-status test can prove it received NONE —
    // not just that the responder's own return value looks right.
    getStartFollowupChatCalls: (): readonly unknown[] => startFollowupChatProxy.getCalls(),
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      pastedImageProxy.setupHome({ homePath });
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      pastedImageProxy.stageImageIds({ ids });
    },
    getPastedImageWrittenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      pastedImageProxy.writtenPayloadFor({ filePath }),
    getPastedImageWriteCallCount: (): unknown => pastedImageProxy.writeCallCount(),
    callResponder: QuestFollowupResponder,
  };
};
