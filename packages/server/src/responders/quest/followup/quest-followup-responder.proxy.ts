import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type {
  GuildIdStub,
  ProcessIdStub,
  QuestId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { QuestFollowupResponder } from './quest-followup-responder';

type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestFollowupResponderProxy = (): {
  setupQuestLoad: (params: { quest: Quest }) => void;
  setupQuestLoadError: (params: { questId: QuestId; error: Error }) => void;
  setupFindQuestPath: (params: { questId: QuestId; guildId: GuildId }) => void;
  setupStartFollowupChat: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupStartFollowupChatError: (params: { questId: QuestId; error: Error }) => void;
  getStartFollowupChatCalls: () => readonly unknown[];
  setupPastedImageHome: (params: { homePath: string }) => void;
  stagePastedImageIds: (params: { ids: readonly string[] }) => void;
  stagePastedImageSourceRead: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  getPastedImageWrittenPayloadFor: (params: { filePath: string }) => unknown;
  getPastedImageWriteCallCount: () => unknown;
  callResponder: typeof QuestFollowupResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath runs the REAL broker through its own staged fs dependencies (readdir,
  // path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes the real
  // questListBroker. That proxy also wires the bare `@dungeonmaster/orchestrator` barrel export
  // this responder calls through, so no separate passthrough is needed here.
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // startFollowupChat has no cross-package getLastCalledArgs scenario on StartOrchestratorProxy,
  // so this second registerMock call on the SAME mocked fn is read-only — it shares the underlying
  // staged calls with the handle StartOrchestratorProxy already registered (jestRegisterMockAdapter
  // keys its state by the mock function itself), never calling .calledWith() on it.
  const startFollowupChatHandle = registerMock({ fn: StartOrchestrator.startFollowupChat });
  // The persist broker is APPLICATION code and runs REAL here — this proxy only mocks the npm
  // boundary underneath it (mkdir, writeFile, randomUUID, homedir). Its methods are re-exposed
  // below under semantic names scoped to "pasted image", never handed back as a raw child proxy.
  const pastedImageProxy = pastedImagePersistBrokerProxy();

  return {
    setupQuestLoad: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupQuestLoadError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
    setupFindQuestPath: ({ questId, guildId }: { questId: QuestId; guildId: GuildId }): void => {
      findQuestPathProxy.setupQuestPath({
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
      orchestrator.startFollowupChatReturns({ questId, chatProcessId });
    },
    setupStartFollowupChatError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.startFollowupChatThrows({ questId, error });
    },
    // Every call the adapter received, so a rejected-status test can prove it received NONE —
    // not just that the responder's own return value looks right.
    getStartFollowupChatCalls: (): readonly unknown[] =>
      startFollowupChatHandle.callsMatching([]).map(([firstArg]: readonly unknown[]) => firstArg),
    setupPastedImageHome: ({ homePath }: { homePath: string }): void => {
      pastedImageProxy.setupHome({ homePath });
    },
    stagePastedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      pastedImageProxy.stageImageIds({ ids });
    },
    // A local image path never carries an upload — its bytes come from the filesystem read the
    // persist broker's own scan/copy step performs, which this stages through the same composed
    // pastedImageProxy the upload path above uses.
    stagePastedImageSourceRead: ({
      filePath,
      bytes,
    }: {
      filePath: AbsoluteFilePath;
      bytes: Uint8Array;
    }): void => {
      pastedImageProxy.sourceReads({ filePath, bytes });
    },
    getPastedImageWrittenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      pastedImageProxy.writtenPayloadFor({ filePath }),
    getPastedImageWriteCallCount: (): unknown => pastedImageProxy.writeCallCount(),
    callResponder: QuestFollowupResponder,
  };
};
