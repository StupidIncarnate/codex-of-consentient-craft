import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts';

import { QuestProjectionResponder } from './quest-projection-responder';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

// Matches the literal VALID_QUEST_ID every test in quest-projection-responder.test.ts passes — the
// responder hands params.questId straight to StartOrchestrator, so the mocked address must match it.
const PROJECTION_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

export const QuestProjectionResponderProxy = (): {
  setupProjection: (params: { projection: QuestProjection }) => void;
  setupQuestNotFound: (params: { message: string }) => void;
  setupQuestNotFoundWithCause: (params: { error: Error }) => void;
  callResponder: typeof QuestProjectionResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      orchestrator.getQuestProjectionReturns({ questId: PROJECTION_QUEST_ID, projection });
    },
    setupQuestNotFound: ({ message }: { message: string }): void => {
      orchestrator.getQuestProjectionThrows({
        questId: PROJECTION_QUEST_ID,
        error: new Error(message),
      });
    },
    // A load failure that wraps its own root cause — the shape the responder's reason formatter
    // unwinds one level of, so the browser sees the fs error behind the missing quest.
    setupQuestNotFoundWithCause: ({ error }: { error: Error }): void => {
      orchestrator.getQuestProjectionThrows({ questId: PROJECTION_QUEST_ID, error });
    },
    callResponder: QuestProjectionResponder,
  };
};
