import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { QuestClarifyResponder } from './quest-clarify-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestClarifyResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: QuestId; error: Error }) => void;
  setupFindQuestPath: (params: {
    questId: QuestId;
    guildId: GuildId;
    questPath: AbsoluteFilePath;
  }) => void;
  setupClarify: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupClarifyError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestClarifyResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath runs the REAL broker through its own staged fs dependencies (readdir,
  // path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes the real
  // questListBroker. That proxy also wires the bare `@dungeonmaster/orchestrator` barrel export
  // this responder calls through, so no separate passthrough is needed here.
  const findQuestPathProxy = questFindQuestPathBrokerProxy();

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupQuestLoadError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
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
      findQuestPathProxy.setupQuestPath({ questId, guildId, questPath });
    },
    setupClarify: ({
      questId,
      chatProcessId,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
    }): void => {
      orchestrator.clarifyAnswerReturns({ questId, chatProcessId });
    },
    setupClarifyError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.clarifyAnswerThrows({ questId, error: new Error(message) });
    },
    callResponder: QuestClarifyResponder,
  };
};
