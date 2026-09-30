import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { QuestSignalBackResponder } from './quest-signal-back-responder';

export const QuestSignalBackResponderProxy = (): {
  setupSignalBack: (params: { questId: Quest['id']; workItemId: WorkItem['id'] }) => void;
  setupSignalBackError: (params: {
    questId: Quest['id'];
    workItemId: WorkItem['id'];
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
      questId: Quest['id'];
      workItemId: WorkItem['id'];
    }): void => {
      orchestrator.handleSignalBackResolves({ questId, workItemId });
    },
    setupSignalBackError: ({
      questId,
      workItemId,
      message,
    }: {
      questId: Quest['id'];
      workItemId: WorkItem['id'];
      message: string;
    }): void => {
      orchestrator.handleSignalBackThrows({ questId, workItemId, error: new Error(message) });
    },
    callResponder: QuestSignalBackResponder,
  };
};
