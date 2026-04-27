import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
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
      setWebPresence: jest.fn(),
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

import { orchestratorClarifyAdapterProxy } from '../../../adapters/orchestrator/clarify/orchestrator-clarify-adapter.proxy';
import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { QuestClarifyResponder } from './quest-clarify-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestClarifyResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { error: Error }) => void;
  setupFindQuestPath: (params: { guildId: GuildId; questPath: AbsoluteFilePath }) => void;
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupClarifyError: (params: { message: string }) => void;
  callResponder: typeof QuestClarifyResponder;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const clarifyProxy = orchestratorClarifyAdapterProxy();

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ quest });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      loadProxy.throws({ error });
    },
    setupFindQuestPath: ({
      guildId,
      questPath,
    }: {
      guildId: GuildId;
      questPath: AbsoluteFilePath;
    }): void => {
      findPathProxy.returns({ guildId, questPath });
    },
    setupClarify: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      clarifyProxy.returns({ chatProcessId });
    },
    setupClarifyError: ({ message }: { message: string }): void => {
      clarifyProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestClarifyResponder,
  };
};
