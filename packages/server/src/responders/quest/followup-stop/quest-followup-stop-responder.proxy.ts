import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { QuestFollowupStopResponder } from './quest-followup-stop-responder';

export const QuestFollowupStopResponderProxy = (): {
  setupStopFollowupChat: (params: { questId: QuestId; stopped: boolean }) => void;
  setupStopFollowupChatError: (params: { questId: QuestId; error: Error }) => void;
  getStopFollowupChatCalls: () => readonly unknown[];
  callResponder: typeof QuestFollowupStopResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  return {
    setupStopFollowupChat: ({ questId, stopped }: { questId: QuestId; stopped: boolean }): void => {
      orchestrator.stopFollowupChatReturns({ questId, stopped });
    },
    setupStopFollowupChatError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.stopFollowupChatThrows({ questId, error });
    },
    // Every call the adapter received, so a bad-params test can prove it received NONE — not just
    // that the responder's own return value looks right.
    getStopFollowupChatCalls: (): readonly unknown[] => orchestrator.stopFollowupChatGetCalls(),
    callResponder: QuestFollowupStopResponder,
  };
};
