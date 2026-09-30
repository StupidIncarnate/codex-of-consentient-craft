import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { QuestFollowupStopResponder } from './quest-followup-stop-responder';

export const QuestFollowupStopResponderProxy = (): {
  setupStopFollowupChat: (params: { questId: Quest['id']; stopped: boolean }) => void;
  setupStopFollowupChatError: (params: { questId: Quest['id']; error: Error }) => void;
  getStopFollowupChatCalls: () => readonly unknown[];
  callResponder: typeof QuestFollowupStopResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  return {
    setupStopFollowupChat: ({
      questId,
      stopped,
    }: {
      questId: Quest['id'];
      stopped: boolean;
    }): void => {
      orchestrator.stopFollowupChatReturns({ questId, stopped });
    },
    setupStopFollowupChatError: ({
      questId,
      error,
    }: {
      questId: Quest['id'];
      error: Error;
    }): void => {
      orchestrator.stopFollowupChatThrows({ questId, error });
    },
    // Every call the adapter received, so a bad-params test can prove it received NONE — not just
    // that the responder's own return value looks right.
    getStopFollowupChatCalls: (): readonly unknown[] => orchestrator.stopFollowupChatGetCalls(),
    callResponder: QuestFollowupStopResponder,
  };
};
