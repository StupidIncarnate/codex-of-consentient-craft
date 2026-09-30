/**
 * PURPOSE: Test setup helper for quest handle responder
 *
 * USAGE:
 * const proxy = QuestHandleResponderProxy();
 * proxy.setupGetQuestReturns({ questId: 'abc', result: GetQuestResultStub() });
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
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

import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import type { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';
import type { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts/orchestration-status/orchestration-status.stub';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import { QuestGetServerConfigResultStub } from '@dungeonmaster/orchestrator/contracts/quest-get-server-config-result/quest-get-server-config-result.stub';
import { QuestHandleResponder } from './quest-handle-responder';

type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;
type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;
type CreateWorktreeResult = Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>;
type GetQuestSummaryResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>;
type QuestGetServerConfigResult = ReturnType<typeof QuestGetServerConfigResultStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type UrlSlug = string;
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
  setupGetQuestReturns: (params: { questId: Quest['id']; result: GetQuestResult }) => void;
  setupGetQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  setupModifyQuestReturns: (params: { questId: Quest['id']; result: ModifyQuestResult }) => void;
  setupModifyQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  setupStartQuestReturns: (params: { questId: QuestId; processId: ProcessId }) => void;
  setupStartQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  setupGetQuestStatusReturns: (params: { processId: string; status: OrchestrationStatus }) => void;
  setupGetQuestStatusServerError: (params: { processId: string; message: string }) => void;
  setupListQuestsReturns: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  setupListQuestsThrows: (params: { guildId: GuildId; error: Error }) => void;
  setupListGuildsThrows: (params: { error: Error }) => void;
  setupGetPlanningNotesReturns: (params: {
    questId: Quest['id'];
    result: GetPlanningNotesResult;
  }) => void;
  setupGetPlanningNotesThrows: (params: { questId: Quest['id']; error: Error }) => void;
  setupGetBlightChecklistReturns: (params: {
    questId: Quest['id'];
    result: GetBlightChecklistResult;
  }) => void;
  setupGetBlightChecklistThrows: (params: { questId: Quest['id']; error: Error }) => void;
  getLastGetBlightChecklistInput: (params: { questId: Quest['id'] }) => unknown;
  setupGetQuestSummaryReturns: (params: {
    questId: Quest['id'];
    summary: GetQuestSummaryResult;
  }) => void;
  setupGetQuestSummaryThrows: (params: { questId: Quest['id']; error: Error }) => void;
  getLastGetQuestSummaryInput: (params: { questId: Quest['id'] }) => unknown;
  setupCreateQuestReturns: (params: {
    userRequest: string;
    questId: QuestId;
    guildSlug: UrlSlug;
  }) => void;
  setupCreateQuestThrows: (params: { userRequest: string; error: Error }) => void;
  getLastCreateQuestInput: () => unknown;
  setupGetServerConfigReturns: (params: { result: QuestGetServerConfigResult }) => void;
  setupGetServerConfigThrows: (params: { error: Error }) => void;
  setupCreateWorktreeReturns: (params: { name: string; result: CreateWorktreeResult }) => void;
  setupCreateWorktreeThrows: (params: { name: string; error: Error }) => void;
  getLastCreateWorktreeInput: (params: { name: string }) => unknown;
  buildServerConfig: () => QuestGetServerConfigResult;
  getLastModifyInput: (params: { questId: Quest['id'] }) => unknown;
  getLastGetPlanningNotesInput: (params: { questId: Quest['id'] }) => unknown;
} => {
  // Composed for enforce-proxy-child-creation against the responder's own imports; the session
  // resolver reads `meta` directly and needs no mocks.
  ResolveCallerSessionLayerResponderProxy();

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
      questId: Quest['id'];
      result: GetQuestResult;
    }): void => {
      getQuestProxy.setupReturns({ questId, result });
    },

    setupGetQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      getQuestProxy.setupThrows({ questId, error });
    },

    setupModifyQuestReturns: ({
      questId,
      result,
    }: {
      questId: Quest['id'];
      result: ModifyQuestResult;
    }): void => {
      orchestrator.modifyQuestReturns({ questId, result });
    },

    setupModifyQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
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

    setupGetQuestStatusServerError: ({
      processId,
      message,
    }: {
      processId: string;
      message: string;
    }): void => {
      getQuestStatusProxy.setupServerError({
        processId: ProcessIdStub({ value: processId }),
        message,
      });
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
      questId: Quest['id'];
      result: GetPlanningNotesResult;
    }): void => {
      orchestrator.getPlanningNotesReturns({ questId, result });
    },

    setupGetPlanningNotesThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.getPlanningNotesThrows({ questId, error });
    },

    setupGetBlightChecklistReturns: ({
      questId,
      result,
    }: {
      questId: Quest['id'];
      result: GetBlightChecklistResult;
    }): void => {
      blightChecklistProxy.setupReturns({ questId, result });
    },

    setupGetBlightChecklistThrows: ({
      questId,
      error,
    }: {
      questId: Quest['id'];
      error: Error;
    }): void => {
      blightChecklistProxy.setupThrows({ questId, error });
    },

    getLastGetBlightChecklistInput: ({ questId }: { questId: Quest['id'] }): unknown =>
      blightChecklistProxy.getLastCalledInputFor({ questId }),

    setupGetQuestSummaryReturns: ({
      questId,
      summary,
    }: {
      questId: Quest['id'];
      summary: GetQuestSummaryResult;
    }): void => {
      questSummaryProxy.setupReturns({ questId, summary });
    },

    setupGetQuestSummaryThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      questSummaryProxy.setupThrows({ questId, error });
    },

    getLastGetQuestSummaryInput: ({ questId }: { questId: Quest['id'] }): unknown =>
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

    getLastCreateQuestInput: (): unknown => {
      const calls = orchestrator.createQuestForMcpGetCalls() as CreateQuestForMcpParams[];
      return calls.at(-1);
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

    buildServerConfig: (): QuestGetServerConfigResult => QuestGetServerConfigResultStub(),

    getLastModifyInput: ({ questId }: { questId: Quest['id'] }): unknown => {
      const calls = orchestrator.modifyQuestGetCalls() as ModifyQuestParams[];
      return calls.filter((call) => call.questId === questId).at(-1)?.input;
    },

    getLastGetPlanningNotesInput: ({ questId }: { questId: Quest['id'] }): unknown => {
      const calls = orchestrator.getPlanningNotesGetCalls() as GetPlanningNotesParams[];
      return calls.filter((call) => call.questId === questId).at(-1);
    },
  };
};
