import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { QuestSignalBackResponder } from './quest-signal-back-responder';

export const QuestSignalBackResponderProxy = (): {
  setupSignalBack: (params: { questId: QuestId; workItemId: QuestWorkItemId }) => void;
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
    }: {
      questId: QuestId;
      workItemId: QuestWorkItemId;
    }): void => {
      orchestrator.handleSignalBackResolves({ questId, workItemId });
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
