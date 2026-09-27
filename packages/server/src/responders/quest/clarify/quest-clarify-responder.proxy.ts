import { questFindQuestPathBroker } from '@dungeonmaster/orchestrator';
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
