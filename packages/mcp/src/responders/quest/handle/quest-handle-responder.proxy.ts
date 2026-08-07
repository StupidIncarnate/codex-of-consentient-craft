/**
 * PURPOSE: Test setup helper for quest handle responder
 *
 * USAGE:
 * const proxy = QuestHandleResponderProxy();
 * proxy.setupGetQuestReturns({ questId: 'abc', result: GetQuestResultStub() });
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 */

import { orchestratorCreateQuestAdapterProxy } from '../../../adapters/orchestrator/create-quest/orchestrator-create-quest-adapter.proxy';
import { ResolveCallerSessionLayerResponderProxy } from './resolve-caller-session-layer-responder.proxy';
import { orchestratorGetNextStepAdapterProxy } from '../../../adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorGetQuestPlanningNotesAdapterProxy } from '../../../adapters/orchestrator/get-quest-planning-notes/orchestrator-get-quest-planning-notes-adapter.proxy';
import { BlightChecklistLayerResponderProxy } from './blight-checklist-layer-responder.proxy';
import { QaChecklistLayerResponderProxy } from './qa-checklist-layer-responder.proxy';
import { QuestSummaryLayerResponderProxy } from './quest-summary-layer-responder.proxy';
import { ResetFlowSignoffsLayerResponderProxy } from './reset-flow-signoffs-layer-responder.proxy';
import { orchestratorGetServerConfigAdapterProxy } from '../../../adapters/orchestrator/get-server-config/orchestrator-get-server-config-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { orchestratorRunWardAdapterProxy } from '../../../adapters/orchestrator/run-ward/orchestrator-run-ward-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { orchestratorGetQuestStatusBrokerProxy } from '../../../brokers/orchestrator/get-quest-status/orchestrator-get-quest-status-broker.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type {
  GetQuestResultStub,
  GuildIdStub,
  ModifyQuestResultStub,
  OrchestrationStatusStub,
  QuestIdStub,
  QuestListItemStub,
  QuestWorkItemIdStub,
  UrlSlugStub,
} from '@dungeonmaster/shared/contracts';
import {
  NextStepStub,
  QuestRunWardResultStub,
  QuestGetServerConfigResultStub,
} from '@dungeonmaster/orchestrator/testing';
import { QuestHandleResponder } from './quest-handle-responder';

type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;
type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;
type ResetFlowSignoffsResult = Awaited<ReturnType<typeof StartOrchestrator.resetFlowSignoffs>>;
type GetQuestSummaryResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>;
type NextStep = ReturnType<typeof NextStepStub>;
type QuestRunWardResult = ReturnType<typeof QuestRunWardResultStub>;
type QuestGetServerConfigResult = ReturnType<typeof QuestGetServerConfigResultStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;
type UrlSlug = ReturnType<typeof UrlSlugStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;

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
  setupResetFlowSignoffsReturns: (params: {
    questId: string;
    flowId: string;
    result: ResetFlowSignoffsResult;
  }) => void;
  setupResetFlowSignoffsThrows: (params: { questId: string; flowId: string; error: Error }) => void;
  getLastResetFlowSignoffsInput: (params: { questId: string; flowId: string }) => unknown;
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
  setupRunWardReturns: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    result: QuestRunWardResult;
  }) => void;
  setupRunWardThrows: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    error: Error;
  }) => void;
  setupGetServerConfigReturns: (params: { result: QuestGetServerConfigResult }) => void;
  setupGetServerConfigThrows: (params: { error: Error }) => void;
  buildIdleNextStep: () => NextStep;
  buildRunWardResult: () => QuestRunWardResult;
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

  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  const startQuestProxy = orchestratorStartQuestAdapterProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusBrokerProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const listGuildsProxy = orchestratorListGuildsAdapterProxy();
  const getPlanningNotesProxy = orchestratorGetQuestPlanningNotesAdapterProxy();
  QaChecklistLayerResponderProxy();
  const blightChecklistProxy = BlightChecklistLayerResponderProxy();
  const resetFlowSignoffsProxy = ResetFlowSignoffsLayerResponderProxy();
  const questSummaryProxy = QuestSummaryLayerResponderProxy();
  const createQuestProxy = orchestratorCreateQuestAdapterProxy();
  const getNextStepProxy = orchestratorGetNextStepAdapterProxy();
  const runWardProxy = orchestratorRunWardAdapterProxy();
  const getServerConfigProxy = orchestratorGetServerConfigAdapterProxy();

  return {
    callResponder: QuestHandleResponder,

    setupGetQuestReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetQuestResult;
    }): void => {
      getQuestProxy.returns({ questId, result });
    },

    setupGetQuestThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getQuestProxy.throws({ questId, error });
    },

    setupModifyQuestReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: ModifyQuestResult;
    }): void => {
      modifyQuestProxy.returns({ questId, result });
    },

    setupModifyQuestThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      modifyQuestProxy.throws({ questId, error });
    },

    setupStartQuestReturns: ({
      questId,
      processId,
    }: {
      questId: QuestId;
      processId: ProcessId;
    }): void => {
      startQuestProxy.returns({ questId, processId });
    },

    setupStartQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      startQuestProxy.throws({ questId, error });
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
      listQuestsProxy.returns({ guildId, quests });
    },

    setupListQuestsThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      listQuestsProxy.throws({ guildId, error });
    },

    setupListGuildsThrows: ({ error }: { error: Error }): void => {
      listGuildsProxy.throws({ error });
    },

    setupGetPlanningNotesReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetPlanningNotesResult;
    }): void => {
      getPlanningNotesProxy.returns({ questId, result });
    },

    setupGetPlanningNotesThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getPlanningNotesProxy.throws({ questId, error });
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

    setupResetFlowSignoffsReturns: ({
      questId,
      flowId,
      result,
    }: {
      questId: string;
      flowId: string;
      result: ResetFlowSignoffsResult;
    }): void => {
      resetFlowSignoffsProxy.setupReturns({ questId, flowId, result });
    },

    setupResetFlowSignoffsThrows: ({
      questId,
      flowId,
      error,
    }: {
      questId: string;
      flowId: string;
      error: Error;
    }): void => {
      resetFlowSignoffsProxy.setupThrows({ questId, flowId, error });
    },

    getLastResetFlowSignoffsInput: ({
      questId,
      flowId,
    }: {
      questId: string;
      flowId: string;
    }): unknown => resetFlowSignoffsProxy.getLastCalledInputFor({ questId, flowId }),

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
      createQuestProxy.returns({ userRequest, questId, guildSlug });
    },

    setupCreateQuestThrows: ({
      userRequest,
      error,
    }: {
      userRequest: string;
      error: Error;
    }): void => {
      createQuestProxy.throws({ userRequest, error });
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

    getLastCreateQuestInput: (): unknown => createQuestProxy.getLastCallInput(),

    setupGetNextStepReturns: ({ step }: { step: NextStep }): void => {
      getNextStepProxy.returns({ step });
    },

    setupGetNextStepThrows: ({ error }: { error: Error }): void => {
      getNextStepProxy.throws({ error });
    },

    setupRunWardReturns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      result: QuestRunWardResult;
    }): void => {
      runWardProxy.returns({ questId, workItemId, result });
    },

    setupRunWardThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      error: Error;
    }): void => {
      runWardProxy.throws({ questId, workItemId, error });
    },

    setupGetServerConfigReturns: ({ result }: { result: QuestGetServerConfigResult }): void => {
      getServerConfigProxy.returns({ result });
    },

    setupGetServerConfigThrows: ({ error }: { error: Error }): void => {
      getServerConfigProxy.throws({ error });
    },

    buildIdleNextStep: (): NextStep => NextStepStub({ type: 'idle' }),

    buildRunWardResult: (): QuestRunWardResult => QuestRunWardResultStub(),

    buildServerConfig: (): QuestGetServerConfigResult => QuestGetServerConfigResultStub(),

    getLastModifyInput: ({ questId }: { questId: string }): unknown =>
      modifyQuestProxy.getLastCalledInputFor({ questId }),

    getLastGetPlanningNotesInput: ({ questId }: { questId: string }): unknown =>
      getPlanningNotesProxy.getLastCalledInputFor({ questId }),
  };
};
