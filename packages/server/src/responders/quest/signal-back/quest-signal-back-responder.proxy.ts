import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import type { AdapterResultStub } from '@dungeonmaster/shared/contracts/adapter-result/adapter-result.stub';

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
  const orchestrator = StartOrchestratorProxy();

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
      orchestrator.handleSignalBackResolves({ questId, workItemId, result });
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
      orchestrator.handleSignalBackThrows({ questId, workItemId, error: new Error(message) });
    },
    callResponder: QuestSignalBackResponder,
  };
};
