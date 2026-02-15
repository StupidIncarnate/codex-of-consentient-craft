import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult, ModifyQuestResult } from '@dungeonmaster/orchestrator';

export const questSessionPersistBrokerProxy = (): {
  setupQuestFound: (params: { result: GetQuestResult }) => void;
  setupQuestNotFound: () => void;
  setupGetQuestThrows: (params: { error: Error }) => void;
  setupModifyReturns: (params: { result: ModifyQuestResult }) => void;
  setupModifyThrows: (params: { error: Error }) => void;
  getModifyCallArgs: () => unknown[];
} => {
  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  processDevLogAdapterProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-02-14T00:00:00.000Z');

  return {
    setupQuestFound: ({ result }: { result: GetQuestResult }): void => {
      getQuestProxy.returns({ result });
    },
    setupQuestNotFound: (): void => {
      getQuestProxy.returns({ result: { success: false } as never });
    },
    setupGetQuestThrows: ({ error }: { error: Error }): void => {
      getQuestProxy.throws({ error });
    },
    setupModifyReturns: ({ result }: { result: ModifyQuestResult }): void => {
      modifyQuestProxy.returns({ result });
    },
    setupModifyThrows: ({ error }: { error: Error }): void => {
      modifyQuestProxy.throws({ error });
    },
    getModifyCallArgs: (): unknown[] =>
      jest.mocked(StartOrchestrator.modifyQuest).mock.calls.flat(),
  };
};
