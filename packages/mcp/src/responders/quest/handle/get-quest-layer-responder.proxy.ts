/**
 * PURPOSE: Proxy for get-quest-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = GetQuestLayerResponderProxy();
 * proxy.setupReturns({ questId: 'add-auth', result: GetQuestResultStub() });
 */

import type { GetQuestResult } from '@dungeonmaster/orchestrator';

import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';

export const GetQuestLayerResponderProxy = (): {
  setupReturns: (params: { questId: string; result: GetQuestResult }) => void;
  setupThrows: (params: { questId: string; error: Error }) => void;
} => {
  const adapterProxy = orchestratorGetQuestAdapterProxy();

  return {
    setupReturns: ({ questId, result }: { questId: string; result: GetQuestResult }): void => {
      adapterProxy.returns({ questId, result });
    },
    setupThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      adapterProxy.throws({ questId, error });
    },
  };
};
