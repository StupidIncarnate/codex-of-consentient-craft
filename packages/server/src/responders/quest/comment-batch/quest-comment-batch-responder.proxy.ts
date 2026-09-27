import { questFindQuestPathBroker, StartOrchestrator } from '@dungeonmaster/orchestrator';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type {
  AbsoluteFilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

// KNOWN HOISTER BUG (2026-09-27, being fixed in packages/testing by a sibling agent — S5 must not
// edit that package): the proxy-mock hoister's merge drops StartOrchestratorProxy's whole-module
// auto-mock when another proxy in this same test mocks a bare export of the SAME module. This
// explicit, FACTORY-LESS registerModuleMock works around it until the fix lands: a bare jest
// automock still deep-mocks every StartOrchestrator method (a plain nested object of functions),
// which is all StartOrchestratorProxy's own registerMock() calls need.
registerModuleMock({ module: '@dungeonmaster/orchestrator' });

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
  const orchestrator = StartOrchestratorProxy();
  // questFindQuestPathBroker is a specific-broker forward, composed via ITS OWN proxy —
  // setupQuestPath runs the REAL broker through its own staged fs dependencies (readdir,
  // path.join, existsSync), the same way questListBrokerProxy's setupDirectList composes the real
  // questListBroker. The bare automock above still leaves questFindQuestPathBroker itself an
  // unstaffed stub (a plain function export, not a nested object jest can deep-mock into anything
  // useful), so this sticky, zero-address passthrough delegates every unaddressed call to the REAL
  // implementation — reached through '@dungeonmaster/orchestrator/brokers', a module specifier
  // distinct from the bare '@dungeonmaster/orchestrator' the automock above replaces, so it is
  // untouched by that automock (orchestrator has no generic per-file source export for a bare
  // broker, only `./*.proxy`/`./*.stub`, and re-exporting from a brokers/ file is banned — `brokers`
  // is that package's own existing subpath for reaching one broker directly without its heavy `.`
  // barrel's bootstraps). Mirrors quest-list-broker.proxy.ts's own real-passthrough default.
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const realFindQuestPath = requireActual<{
    questFindQuestPathBroker: typeof questFindQuestPathBroker;
  }>({
    module: '@dungeonmaster/orchestrator/brokers',
  });
  findQuestPathMock.calledWith([]).implement(realFindQuestPath.questFindQuestPathBroker as never);
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // commentBatch has no cross-package getLastCalledArgs/getCalls scenario on StartOrchestratorProxy,
  // so this second registerMock call on the SAME mocked fn is read-only — it shares the underlying
  // staged calls with the handle StartOrchestratorProxy already registered (jestRegisterMockAdapter
  // keys its state by the mock function itself), never calling .calledWith() on it.
  const commentBatchHandle = registerMock({ fn: StartOrchestrator.commentBatch });

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
      orchestrator.commentBatchReturns({ questId, chatProcessId, message: deliveredMessage });
    },
    setupCommentBatchError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.commentBatchThrows({ questId, error: new Error(message) });
    },
    getDeliveredBatch: ({ questId }: { questId: QuestId }): unknown =>
      commentBatchHandle.callsMatching([{ questId }]).at(-1)?.[0],
    // Empty array proves no chat process was spawned — the guarantee on the 409 and the
    // persist-failure paths.
    getDeliveryAttempts: ({ questId }: { questId: QuestId }): unknown[] =>
      commentBatchHandle.callsMatching([{ questId }]),
    callResponder: QuestCommentBatchResponder,
  };
};
