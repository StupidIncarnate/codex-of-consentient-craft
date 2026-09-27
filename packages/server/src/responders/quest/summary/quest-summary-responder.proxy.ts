import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts';

import { QuestSummaryResponder } from './quest-summary-responder';

type QuestSummary = ReturnType<typeof QuestSummaryStub>;

// Matches the literal VALID_QUEST_ID every test in quest-summary-responder.test.ts passes — the
// responder hands params.questId straight to StartOrchestrator, so the mocked address must match it.
const SUMMARY_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

export const QuestSummaryResponderProxy = (): {
  setupSummary: (params: { summary: QuestSummary }) => void;
  setupQuestNotFound: (params: { message: string }) => void;
  setupQuestNotFoundWithCause: (params: { error: Error }) => void;
  callResponder: typeof QuestSummaryResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupSummary: ({ summary }: { summary: QuestSummary }): void => {
      orchestrator.getQuestSummaryReturns({ questId: SUMMARY_QUEST_ID, summary });
    },
    setupQuestNotFound: ({ message }: { message: string }): void => {
      orchestrator.getQuestSummaryThrows({ questId: SUMMARY_QUEST_ID, error: new Error(message) });
    },
    // A load failure that wraps its own root cause — the shape the responder's reason formatter
    // unwinds one level of, so the browser sees the fs error behind the missing quest.
    setupQuestNotFoundWithCause: ({ error }: { error: Error }): void => {
      orchestrator.getQuestSummaryThrows({ questId: SUMMARY_QUEST_ID, error });
    },
    callResponder: QuestSummaryResponder,
  };
};
