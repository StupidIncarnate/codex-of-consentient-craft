import type { QuestId } from '@dungeonmaster/shared/contracts';

import { orchestratorStopFollowupChatAdapterProxy } from '../../../adapters/orchestrator/stop-followup-chat/orchestrator-stop-followup-chat-adapter.proxy';
import { QuestFollowupStopResponder } from './quest-followup-stop-responder';

export const QuestFollowupStopResponderProxy = (): {
  setupStopFollowupChat: (params: { questId: QuestId; stopped: boolean }) => void;
  setupStopFollowupChatError: (params: { questId: QuestId; error: Error }) => void;
  getStopFollowupChatCalls: () => readonly unknown[];
  callResponder: typeof QuestFollowupStopResponder;
} => {
  const stopProxy = orchestratorStopFollowupChatAdapterProxy();

  return {
    setupStopFollowupChat: ({ questId, stopped }: { questId: QuestId; stopped: boolean }): void => {
      stopProxy.returns({ questId, stopped });
    },
    setupStopFollowupChatError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      stopProxy.throws({ questId, error });
    },
    // Every call the adapter received, so a bad-params test can prove it received NONE — not just
    // that the responder's own return value looks right.
    getStopFollowupChatCalls: (): readonly unknown[] => stopProxy.getCalls(),
    callResponder: QuestFollowupStopResponder,
  };
};
