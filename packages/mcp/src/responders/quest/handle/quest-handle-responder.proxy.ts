/**
 * PURPOSE: Test setup helper for quest handle responder
 *
 * USAGE:
 * const proxy = QuestHandleResponderProxy();
 * proxy.setupGetQuestReturns({ result: GetQuestResultStub() });
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 */

import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { orchestratorCreateQuestAdapterProxy } from '../../../adapters/orchestrator/create-quest/orchestrator-create-quest-adapter.proxy';
import { claudeCodeSessionResolveBrokerProxy } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker.proxy';
import { orchestratorGetNextStepAdapterProxy } from '../../../adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorGetQuestPlanningNotesAdapterProxy } from '../../../adapters/orchestrator/get-quest-planning-notes/orchestrator-get-quest-planning-notes-adapter.proxy';
import { orchestratorGetServerConfigAdapterProxy } from '../../../adapters/orchestrator/get-server-config/orchestrator-get-server-config-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { orchestratorRunWardAdapterProxy } from '../../../adapters/orchestrator/run-ward/orchestrator-run-ward-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { orchestratorGetQuestStatusBrokerProxy } from '../../../brokers/orchestrator/get-quest-status/orchestrator-get-quest-status-broker.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import type {
  GetQuestResultStub,
  ModifyQuestResultStub,
  OrchestrationStatusStub,
  QuestIdStub,
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
type NextStep = ReturnType<typeof NextStepStub>;
type QuestRunWardResult = ReturnType<typeof QuestRunWardResultStub>;
type QuestGetServerConfigResult = ReturnType<typeof QuestGetServerConfigResultStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type UrlSlug = ReturnType<typeof UrlSlugStub>;

export const QuestHandleResponderProxy = (): {
  callResponder: typeof QuestHandleResponder;
  setupGetQuestReturns: (params: { result: GetQuestResult }) => void;
  setupGetQuestThrows: (params: { error: Error }) => void;
  setupModifyQuestReturns: (params: { result: ModifyQuestResult }) => void;
  setupModifyQuestThrows: (params: { error: Error }) => void;
  setupStartQuestThrows: (params: { error: Error }) => void;
  setupGetQuestStatusReturns: (params: { status: OrchestrationStatus }) => void;
  setupGetQuestStatusThrows: (params: { error: Error }) => void;
  setupListQuestsThrows: (params: { error: Error }) => void;
  setupListGuildsThrows: (params: { error: Error }) => void;
  setupGetPlanningNotesReturns: (params: { result: GetPlanningNotesResult }) => void;
  setupGetPlanningNotesThrows: (params: { error: Error }) => void;
  setupCreateQuestReturns: (params: { questId: QuestId; guildSlug: UrlSlug }) => void;
  setupCreateQuestThrows: (params: { error: Error }) => void;
  setupGetNextStepReturns: (params: { step: NextStep }) => void;
  setupGetNextStepThrows: (params: { error: Error }) => void;
  setupRunWardReturns: (params: { result: QuestRunWardResult }) => void;
  setupRunWardThrows: (params: { error: Error }) => void;
  setupGetServerConfigReturns: (params: { result: QuestGetServerConfigResult }) => void;
  setupGetServerConfigThrows: (params: { error: Error }) => void;
  buildIdleNextStep: () => NextStep;
  buildRunWardResult: () => QuestRunWardResult;
  buildServerConfig: () => QuestGetServerConfigResult;
  getLastModifyInput: () => unknown;
  getLastGetPlanningNotesInput: () => unknown;
} => {
  // create-quest resolves sessionId using processCwdAdapter + claudeCodeSessionResolveBroker;
  // initialize these proxies so the mocks are registered for every test.
  processCwdAdapterProxy();
  const sessionResolveProxy = claudeCodeSessionResolveBrokerProxy();
  // Default: session dir is missing so resolve returns undefined (session unstamped).
  sessionResolveProxy.setupSessionsDirMissing();

  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  const startQuestProxy = orchestratorStartQuestAdapterProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusBrokerProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const listGuildsProxy = orchestratorListGuildsAdapterProxy();
  const getPlanningNotesProxy = orchestratorGetQuestPlanningNotesAdapterProxy();
  const createQuestProxy = orchestratorCreateQuestAdapterProxy();
  const getNextStepProxy = orchestratorGetNextStepAdapterProxy();
  const runWardProxy = orchestratorRunWardAdapterProxy();
  const getServerConfigProxy = orchestratorGetServerConfigAdapterProxy();

  return {
    callResponder: QuestHandleResponder,

    setupGetQuestReturns: ({ result }: { result: GetQuestResult }): void => {
      getQuestProxy.returns({ result });
    },

    setupGetQuestThrows: ({ error }: { error: Error }): void => {
      getQuestProxy.throws({ error });
    },

    setupModifyQuestReturns: ({ result }: { result: ModifyQuestResult }): void => {
      modifyQuestProxy.returns({ result });
    },

    setupModifyQuestThrows: ({ error }: { error: Error }): void => {
      modifyQuestProxy.throws({ error });
    },

    setupStartQuestThrows: ({ error }: { error: Error }): void => {
      startQuestProxy.throws({ error });
    },

    setupGetQuestStatusReturns: ({ status }: { status: OrchestrationStatus }): void => {
      getQuestStatusProxy.returns({ status });
    },

    setupGetQuestStatusThrows: ({ error }: { error: Error }): void => {
      getQuestStatusProxy.throws({ error });
    },

    setupListQuestsThrows: ({ error }: { error: Error }): void => {
      listQuestsProxy.throws({ error });
    },

    setupListGuildsThrows: ({ error }: { error: Error }): void => {
      listGuildsProxy.throws({ error });
    },

    setupGetPlanningNotesReturns: ({ result }: { result: GetPlanningNotesResult }): void => {
      getPlanningNotesProxy.returns({ result });
    },

    setupGetPlanningNotesThrows: ({ error }: { error: Error }): void => {
      getPlanningNotesProxy.throws({ error });
    },

    setupCreateQuestReturns: ({
      questId,
      guildSlug,
    }: {
      questId: QuestId;
      guildSlug: UrlSlug;
    }): void => {
      createQuestProxy.returns({ questId, guildSlug });
    },

    setupCreateQuestThrows: ({ error }: { error: Error }): void => {
      createQuestProxy.throws({ error });
    },

    setupGetNextStepReturns: ({ step }: { step: NextStep }): void => {
      getNextStepProxy.returns({ step });
    },

    setupGetNextStepThrows: ({ error }: { error: Error }): void => {
      getNextStepProxy.throws({ error });
    },

    setupRunWardReturns: ({ result }: { result: QuestRunWardResult }): void => {
      runWardProxy.returns({ result });
    },

    setupRunWardThrows: ({ error }: { error: Error }): void => {
      runWardProxy.throws({ error });
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

    getLastModifyInput: (): unknown => modifyQuestProxy.getLastCalledInput(),

    getLastGetPlanningNotesInput: (): unknown => getPlanningNotesProxy.getLastCalledInput(),
  };
};
