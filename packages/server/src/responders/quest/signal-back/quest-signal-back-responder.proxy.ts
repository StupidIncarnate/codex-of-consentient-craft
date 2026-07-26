import type { AdapterResultStub, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { QuestSignalBackResponder } from './quest-signal-back-responder';

type AdapterResult = ReturnType<typeof AdapterResultStub>;

export const QuestSignalBackResponderProxy = (): {
  setupSignalBack: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    result: AdapterResult;
  }) => void;
  setupSignalBackError: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    message: string;
  }) => void;
  callResponder: typeof QuestSignalBackResponder;
} => {
  const adapterProxy = orchestratorHandleSignalBackAdapterProxy();

  return {
    setupSignalBack: ({
      questId,
      workItemId,
      result,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      result: AdapterResult;
    }): void => {
      adapterProxy.resolves({ questId, workItemId, result });
    },
    setupSignalBackError: ({
      questId,
      workItemId,
      message,
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
      message: string;
    }): void => {
      adapterProxy.throws({ questId, workItemId, error: new Error(message) });
    },
    callResponder: QuestSignalBackResponder,
  };
};
