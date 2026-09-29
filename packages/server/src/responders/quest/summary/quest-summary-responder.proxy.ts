import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts/quest-summary/quest-summary.stub';

import { QuestSummaryResponder } from './quest-summary-responder';

type QuestSummary = ReturnType<typeof QuestSummaryStub>;

// Matches the literal VALID_QUEST_ID every test in quest-summary-responder.test.ts passes — the
// responder hands params.questId straight to StartOrchestrator, so the mocked address must match it.
const SUMMARY_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

export const QuestSummaryResponderProxy = (): {
  setupSummary: (params: { summary: QuestSummary }) => void;
  setupQuestNotFound: (params: { message: string; cause?: Error }) => void;
  setupQuestLoadFails: (params: { error: Error }) => void;
  callResponder: typeof QuestSummaryResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupSummary: ({ summary }: { summary: QuestSummary }): void => {
      orchestrator.getQuestSummaryReturns({ questId: SUMMARY_QUEST_ID, summary });
    },
    // The orchestrator's missing-quest error is named QuestNotFoundError; its class is not exported
    // from the orchestrator barrel, so the staged error carries the same name.
    setupQuestNotFound: ({ message, cause }: { message: string; cause?: Error }): void => {
      orchestrator.getQuestSummaryThrows({
        questId: SUMMARY_QUEST_ID,
        error: Object.assign(new Error(message, cause === undefined ? undefined : { cause }), {
          name: 'QuestNotFoundError',
        }),
      });
    },
    setupQuestLoadFails: ({ error }: { error: Error }): void => {
      orchestrator.getQuestSummaryThrows({ questId: SUMMARY_QUEST_ID, error });
    },
    callResponder: QuestSummaryResponder,
  };
};
