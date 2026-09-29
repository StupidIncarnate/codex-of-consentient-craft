import { QuestNotFoundError } from '@dungeonmaster/orchestrator';
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
  setupQuestNotFound: (params: { cause?: Error }) => void;
  setupQuestLoadFails: (params: { error: Error }) => void;
  callResponder: typeof QuestSummaryResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupSummary: ({ summary }: { summary: QuestSummary }): void => {
      orchestrator.getQuestSummaryReturns({ questId: SUMMARY_QUEST_ID, summary });
    },
    setupQuestNotFound: ({ cause }: { cause?: Error }): void => {
      orchestrator.getQuestSummaryThrows({
        questId: SUMMARY_QUEST_ID,
        error: Object.assign(new QuestNotFoundError({ questId: SUMMARY_QUEST_ID }), {
          ...(cause === undefined ? {} : { cause }),
        }),
      });
    },
    setupQuestLoadFails: ({ error }: { error: Error }): void => {
      orchestrator.getQuestSummaryThrows({ questId: SUMMARY_QUEST_ID, error });
    },
    callResponder: QuestSummaryResponder,
  };
};
