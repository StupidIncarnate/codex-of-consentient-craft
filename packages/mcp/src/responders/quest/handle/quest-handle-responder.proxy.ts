/**
 * PURPOSE: Test setup helper for quest handle responder
 *
 * USAGE:
 * const proxy = QuestHandleResponderProxy();
 * proxy.setupGetQuestReturns({ result: GetQuestResultStub() });
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-quest' }), args: { questId: 'abc' } });
 */

import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { orchestratorGetQuestStatusAdapterProxy } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import { orchestratorVerifyQuestAdapterProxy } from '../../../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter.proxy';
import type { GetQuestResultStub } from '../../../contracts/get-quest-result/get-quest-result.stub';
import type { ModifyQuestResultStub } from '../../../contracts/modify-quest-result/modify-quest-result.stub';
import type { VerifyQuestResultStub } from '../../../contracts/verify-quest-result/verify-quest-result.stub';
import { QuestHandleResponder } from './quest-handle-responder';

type GetQuestResult = ReturnType<typeof GetQuestResultStub>;
type ModifyQuestResult = ReturnType<typeof ModifyQuestResultStub>;
type VerifyQuestResult = ReturnType<typeof VerifyQuestResultStub>;

export const QuestHandleResponderProxy = (): {
  callResponder: typeof QuestHandleResponder;
  setupGetQuestReturns: (params: { result: GetQuestResult }) => void;
  setupGetQuestThrows: (params: { error: Error }) => void;
  setupModifyQuestReturns: (params: { result: ModifyQuestResult }) => void;
  setupModifyQuestThrows: (params: { error: Error }) => void;
  setupStartQuestThrows: (params: { error: Error }) => void;
  setupGetQuestStatusThrows: (params: { error: Error }) => void;
  setupVerifyQuestReturns: (params: { result: VerifyQuestResult }) => void;
  setupVerifyQuestThrows: (params: { error: Error }) => void;
  setupListQuestsThrows: (params: { error: Error }) => void;
  setupListGuildsThrows: (params: { error: Error }) => void;
} => {
  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  const startQuestProxy = orchestratorStartQuestAdapterProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusAdapterProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const listGuildsProxy = orchestratorListGuildsAdapterProxy();
  const verifyQuestProxy = orchestratorVerifyQuestAdapterProxy();

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

    setupVerifyQuestReturns: ({ result }: { result: VerifyQuestResult }): void => {
      verifyQuestProxy.returns({ result });
    },

    setupVerifyQuestThrows: ({ error }: { error: Error }): void => {
      verifyQuestProxy.throws({ error });
    },

    setupListQuestsThrows: ({ error }: { error: Error }): void => {
      listQuestsProxy.throws({ error });
    },

    setupListGuildsThrows: ({ error }: { error: Error }): void => {
      listGuildsProxy.throws({ error });
    },
  };
};
