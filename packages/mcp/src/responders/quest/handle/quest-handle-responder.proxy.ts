/**
 * PURPOSE: Test setup helper for quest handle responder
 *
 * USAGE:
 * const proxy = QuestHandleResponderProxy();
 * proxy.setupGetQuestReturns({ result: GetQuestResultStub() });
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 */

import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorGetPlanningNotesAdapterProxy } from '../../../adapters/orchestrator/get-planning-notes/orchestrator-get-planning-notes-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { orchestratorGetQuestStatusAdapterProxy } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import type { GetQuestResultStub } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';
import { QuestHandleResponder } from './quest-handle-responder';

type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;

export const QuestHandleResponderProxy = (): {
  callResponder: typeof QuestHandleResponder;
  setupGetQuestReturns: (params: { result: GetQuestResult }) => void;
  setupGetQuestThrows: (params: { error: Error }) => void;
  setupModifyQuestReturns: (params: { result: ModifyQuestResult }) => void;
  setupModifyQuestThrows: (params: { error: Error }) => void;
  setupStartQuestThrows: (params: { error: Error }) => void;
  setupGetQuestStatusThrows: (params: { error: Error }) => void;
  setupListQuestsThrows: (params: { error: Error }) => void;
  setupListGuildsThrows: (params: { error: Error }) => void;
  setupGetPlanningNotesReturns: (params: { result: GetPlanningNotesResult }) => void;
  setupGetPlanningNotesThrows: (params: { error: Error }) => void;
  getLastModifyInput: () => unknown;
  getLastGetPlanningNotesInput: () => unknown;
} => {
  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  const startQuestProxy = orchestratorStartQuestAdapterProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusAdapterProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const listGuildsProxy = orchestratorListGuildsAdapterProxy();
  const getPlanningNotesProxy = orchestratorGetPlanningNotesAdapterProxy();

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

    getLastModifyInput: (): unknown => modifyQuestProxy.getLastCalledInput(),

    getLastGetPlanningNotesInput: (): unknown => getPlanningNotesProxy.getLastCalledInput(),
  };
};
