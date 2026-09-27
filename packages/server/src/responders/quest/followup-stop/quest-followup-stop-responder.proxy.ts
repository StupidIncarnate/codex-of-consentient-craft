import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { QuestFollowupStopResponder } from './quest-followup-stop-responder';

export const QuestFollowupStopResponderProxy = (): {
  setupStopFollowupChat: (params: { questId: QuestId; stopped: boolean }) => void;
  setupStopFollowupChatError: (params: { questId: QuestId; error: Error }) => void;
  getStopFollowupChatCalls: () => readonly unknown[];
  callResponder: typeof QuestFollowupStopResponder;
} => {
  const orchestrator = StartOrchestratorProxy();
  // stopFollowupChat has no cross-package getLastCalledArgs/getCalls scenario on
  // StartOrchestratorProxy, so this second registerMock call on the SAME mocked fn is read-only —
  // it shares the underlying staged calls with the handle StartOrchestratorProxy already
  // registered (jestRegisterMockAdapter keys its state by the mock function itself), never calling
  // .calledWith() on it.
  const stopFollowupChatHandle = registerMock({ fn: StartOrchestrator.stopFollowupChat });

  return {
    setupStopFollowupChat: ({ questId, stopped }: { questId: QuestId; stopped: boolean }): void => {
      orchestrator.stopFollowupChatReturns({ questId, stopped });
    },
    setupStopFollowupChatError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.stopFollowupChatThrows({ questId, error });
    },
    // Every call the adapter received, so a bad-params test can prove it received NONE — not just
    // that the responder's own return value looks right.
    getStopFollowupChatCalls: (): readonly unknown[] =>
      stopFollowupChatHandle.callsMatching([]).map(([firstArg]: readonly unknown[]) => firstArg),
    callResponder: QuestFollowupStopResponder,
  };
};
