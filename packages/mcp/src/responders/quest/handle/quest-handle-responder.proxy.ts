/**
 * PURPOSE: Test setup helper for quest handle responder
 *
 * USAGE:
 * const proxy = QuestHandleResponderProxy();
 * proxy.setupGetQuestReturns({ questId: 'abc', result: GetQuestResultStub() });
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 */

import { ResolveCallerSessionLayerResponderProxy } from './resolve-caller-session-layer-responder.proxy';
import { BlightChecklistLayerResponderProxy } from './blight-checklist-layer-responder.proxy';
import { CreateWorktreeLayerResponderProxy } from './create-worktree-layer-responder.proxy';
import { GetQuestLayerResponderProxy } from './get-quest-layer-responder.proxy';
import { GetQuestWorkLayerResponderProxy } from './get-quest-work-layer-responder.proxy';
import { QuestWorkLayerResponderProxy } from './quest-work-layer-responder.proxy';
import { QuestSummaryLayerResponderProxy } from './quest-summary-layer-responder.proxy';
import { orchestratorGetQuestStatusBrokerProxy } from '../../../brokers/orchestrator/get-quest-status/orchestrator-get-quest-status-broker.proxy';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type {
  GetQuestResultStub,
  GuildIdStub,
  ModifyQuestResultStub,
  OrchestrationStatusStub,
  QuestIdStub,
  QuestListItemStub,
  UrlSlugStub,
} from '@dungeonmaster/shared/contracts';
import { NextStepStub, QuestGetServerConfigResultStub } from '@dungeonmaster/orchestrator/testing';
import { QuestHandleResponder } from './quest-handle-responder';

type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;
type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;
type CreateWorktreeResult = Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>;
type GetQuestSummaryResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>;
type NextStep = ReturnType<typeof NextStepStub>;
type QuestGetServerConfigResult = ReturnType<typeof QuestGetServerConfigResultStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type UrlSlug = ReturnType<typeof UrlSlugStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
// Derived from the real StartOrchestrator method signatures (never hand-typed) so the elements
// each *GetCalls() hands back can be read by field without an ad-hoc structural cast.
type ModifyQuestParams = Parameters<typeof StartOrchestrator.modifyQuest>[0];
type CreateQuestForMcpParams = Parameters<typeof StartOrchestrator.createQuestForMcp>[0];
type GetPlanningNotesParams = Parameters<typeof StartOrchestrator.getPlanningNotes>[0];

export const QuestHandleResponderProxy = (): {
  callResponder: typeof QuestHandleResponder;
  setupGetQuestReturns: (params: { questId: string; result: GetQuestResult }) => void;
  setupGetQuestThrows: (params: { questId: string; error: Error }) => void;
  setupModifyQuestReturns: (params: { questId: string; result: ModifyQuestResult }) => void;
  setupModifyQuestThrows: (params: { questId: string; error: Error }) => void;
  setupStartQuestReturns: (params: { questId: QuestId; processId: ProcessId }) => void;
  setupStartQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  setupGetQuestStatusReturns: (params: { processId: string; status: OrchestrationStatus }) => void;
  setupGetQuestStatusThrows: (params: { processId: string; error: Error }) => void;
  setupListQuestsReturns: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  setupListQuestsThrows: (params: { guildId: GuildId; error: Error }) => void;
  setupListGuildsThrows: (params: { error: Error }) => void;
  setupGetPlanningNotesReturns: (params: {
    questId: string;
    result: GetPlanningNotesResult;
  }) => void;
  setupGetPlanningNotesThrows: (params: { questId: string; error: Error }) => void;
  setupGetBlightChecklistReturns: (params: {
    questId: string;
    result: GetBlightChecklistResult;
  }) => void;
  setupGetBlightChecklistThrows: (params: { questId: string; error: Error }) => void;
  getLastGetBlightChecklistInput: (params: { questId: string }) => unknown;
  setupGetQuestSummaryReturns: (params: {
    questId: string;
    summary: GetQuestSummaryResult;
  }) => void;
  setupGetQuestSummaryThrows: (params: { questId: string; error: Error }) => void;
  getLastGetQuestSummaryInput: (params: { questId: string }) => unknown;
  setupCreateQuestReturns: (params: {
    userRequest: string;
    questId: QuestId;
    guildSlug: UrlSlug;
  }) => void;
  setupCreateQuestThrows: (params: { userRequest: string; error: Error }) => void;
  // Stages the Claude Code session-resolve broker's "found" path (real fs.readdir/fs.stat
  // adapters underneath) against the same homedir/projectDir the responder's unstaged
  // processCwdAdapter/osUserHomedirAdapter defaults resolve to, so a test can prove the
  // create-quest tool's `resolved !== undefined` branch threads sessionId through.
  setupSessionResolved: (params: { entries: readonly { name: string; mtimeMs: number }[] }) => void;
  getLastCreateQuestInput: () => unknown;
  setupGetNextStepReturns: (params: { step: NextStep }) => void;
  setupGetNextStepThrows: (params: { error: Error }) => void;
  setupGetServerConfigReturns: (params: { result: QuestGetServerConfigResult }) => void;
  setupGetServerConfigThrows: (params: { error: Error }) => void;
  setupCreateWorktreeReturns: (params: { name: string; result: CreateWorktreeResult }) => void;
  setupCreateWorktreeThrows: (params: { name: string; error: Error }) => void;
  getLastCreateWorktreeInput: (params: { name: string }) => unknown;
  buildIdleNextStep: () => NextStep;
  buildServerConfig: () => QuestGetServerConfigResult;
  getLastModifyInput: (params: { questId: string }) => unknown;
  getLastGetPlanningNotesInput: (params: { questId: string }) => unknown;
} => {
  // create-quest resolves the caller's sessionId through this layer; initialize its proxy so the
  // mocks are registered for every test.
  const callerSessionProxy = ResolveCallerSessionLayerResponderProxy();
  // Default: sessions dir is missing so BOTH strategies return undefined (session unstamped).
  // Nothing in this proxy stages processCwdAdapter or the homedir adapter, so the real calls land
  // on their unstaged defaults ('/default/cwd', '/home/default') — this address must match those.
  callerSessionProxy.setupSessionsMissing({
    homedir: '/home/default',
    projectDir: '/default/cwd',
  });

  const getQuestProxy = GetQuestLayerResponderProxy();
  const orchestrator = StartOrchestratorProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusBrokerProxy();
  // Composed for enforce-proxy-child-creation against the responder's own imports; the two work
  // tools stage nothing here, and each has its own colocated suite.
  GetQuestWorkLayerResponderProxy();
  QuestWorkLayerResponderProxy();
  const blightChecklistProxy = BlightChecklistLayerResponderProxy();
  const questSummaryProxy = QuestSummaryLayerResponderProxy();
  const createWorktreeProxy = CreateWorktreeLayerResponderProxy();

  return {
    callResponder: QuestHandleResponder,

    setupGetQuestReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetQuestResult;
    }): void => {
      getQuestProxy.setupReturns({ questId, result });
    },

    setupGetQuestThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getQuestProxy.setupThrows({ questId, error });
    },

    setupModifyQuestReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: ModifyQuestResult;
    }): void => {
      orchestrator.modifyQuestReturns({ questId, result });
    },

    setupModifyQuestThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      orchestrator.modifyQuestThrows({ questId, error });
    },

    setupStartQuestReturns: ({
      questId,
      processId,
    }: {
      questId: QuestId;
      processId: ProcessId;
    }): void => {
      orchestrator.startQuestReturns({ questId, processId });
    },

    setupStartQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.startQuestThrows({ questId, error });
    },

    // processId is plain string here (matching every sibling setup*'s questId/guildId), branded
    // internally to the ProcessId the underlying broker proxy addresses its mock on.
    setupGetQuestStatusReturns: ({
      processId,
      status,
    }: {
      processId: string;
      status: OrchestrationStatus;
    }): void => {
      getQuestStatusProxy.returns({ processId: ProcessIdStub({ value: processId }), status });
    },

    setupGetQuestStatusThrows: ({
      processId,
      error,
    }: {
      processId: string;
      error: Error;
    }): void => {
      getQuestStatusProxy.throws({ processId: ProcessIdStub({ value: processId }), error });
    },

    setupListQuestsReturns: ({
      guildId,
      quests,
    }: {
      guildId: GuildId;
      quests: QuestListItem[];
    }): void => {
      orchestrator.listQuestsReturns({ guildId, quests });
    },

    setupListQuestsThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      orchestrator.listQuestsThrows({ guildId, error });
    },

    setupListGuildsThrows: ({ error }: { error: Error }): void => {
      orchestrator.listGuildsThrows({ error });
    },

    setupGetPlanningNotesReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetPlanningNotesResult;
    }): void => {
      orchestrator.getPlanningNotesReturns({ questId, result });
    },

    setupGetPlanningNotesThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      orchestrator.getPlanningNotesThrows({ questId, error });
    },

    setupGetBlightChecklistReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetBlightChecklistResult;
    }): void => {
      blightChecklistProxy.setupReturns({ questId, result });
    },

    setupGetBlightChecklistThrows: ({
      questId,
      error,
    }: {
      questId: string;
      error: Error;
    }): void => {
      blightChecklistProxy.setupThrows({ questId, error });
    },

    getLastGetBlightChecklistInput: ({ questId }: { questId: string }): unknown =>
      blightChecklistProxy.getLastCalledInputFor({ questId }),

    setupGetQuestSummaryReturns: ({
      questId,
      summary,
    }: {
      questId: string;
      summary: GetQuestSummaryResult;
    }): void => {
      questSummaryProxy.setupReturns({ questId, summary });
    },

    setupGetQuestSummaryThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      questSummaryProxy.setupThrows({ questId, error });
    },

    getLastGetQuestSummaryInput: ({ questId }: { questId: string }): unknown =>
      questSummaryProxy.getLastCalledInputFor({ questId }),

    setupCreateQuestReturns: ({
      userRequest,
      questId,
      guildSlug,
    }: {
      userRequest: string;
      questId: QuestId;
      guildSlug: UrlSlug;
    }): void => {
      orchestrator.createQuestForMcpReturns({ userRequest, questId, guildSlug });
    },

    setupCreateQuestThrows: ({
      userRequest,
      error,
    }: {
      userRequest: string;
      error: Error;
    }): void => {
      orchestrator.createQuestForMcpThrows({ userRequest, error });
    },

    setupSessionResolved: ({
      entries,
    }: {
      entries: readonly { name: string; mtimeMs: number }[];
    }): void => {
      callerSessionProxy.setupSessions({
        homedir: '/home/default',
        projectDir: '/default/cwd',
        // create-quest tests exercise the newest-mtime fallback: they call the tool without
        // `meta`, so the deterministic toolUseId scan is skipped entirely.
        sessions: [],
        mtimeEntries: entries,
      });
    },

    getLastCreateQuestInput: (): unknown => {
      const calls = orchestrator.createQuestForMcpGetCalls() as CreateQuestForMcpParams[];
      return calls.at(-1);
    },

    setupGetNextStepReturns: ({ step }: { step: NextStep }): void => {
      orchestrator.getNextStepReturns({ step });
    },

    setupGetNextStepThrows: ({ error }: { error: Error }): void => {
      orchestrator.getNextStepThrows({ error });
    },

    setupGetServerConfigReturns: ({ result }: { result: QuestGetServerConfigResult }): void => {
      orchestrator.getServerConfigReturns({ result });
    },

    setupGetServerConfigThrows: ({ error }: { error: Error }): void => {
      orchestrator.getServerConfigThrows({ error });
    },

    setupCreateWorktreeReturns: ({
      name,
      result,
    }: {
      name: string;
      result: CreateWorktreeResult;
    }): void => {
      createWorktreeProxy.setupReturns({ name, result });
    },

    setupCreateWorktreeThrows: ({ name, error }: { name: string; error: Error }): void => {
      createWorktreeProxy.setupThrows({ name, error });
    },

    getLastCreateWorktreeInput: ({ name }: { name: string }): unknown =>
      createWorktreeProxy.getLastCalledInputFor({ name }),

    buildIdleNextStep: (): NextStep => NextStepStub({ type: 'idle' }),

    buildServerConfig: (): QuestGetServerConfigResult => QuestGetServerConfigResultStub(),

    getLastModifyInput: ({ questId }: { questId: string }): unknown => {
      const calls = orchestrator.modifyQuestGetCalls() as ModifyQuestParams[];
      return calls.filter((call) => call.questId === questId).at(-1)?.input;
    },

    getLastGetPlanningNotesInput: ({ questId }: { questId: string }): unknown => {
      const calls = orchestrator.getPlanningNotesGetCalls() as GetPlanningNotesParams[];
      return calls.filter((call) => call.questId === questId).at(-1);
    },
  };
};
