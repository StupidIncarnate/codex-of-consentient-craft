import { QuestNotFoundError } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts/quest-projection/quest-projection.stub';

import { QuestProjectionResponder } from './quest-projection-responder';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

// Matches the literal VALID_QUEST_ID every test in quest-projection-responder.test.ts passes — the
// responder hands params.questId straight to StartOrchestrator, so the mocked address must match it.
const PROJECTION_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

export const QuestProjectionResponderProxy = (): {
  setupProjection: (params: { projection: QuestProjection }) => void;
  setupQuestNotFound: (params: { cause?: Error }) => void;
  setupQuestLoadFails: (params: { error: Error }) => void;
  callResponder: typeof QuestProjectionResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      orchestrator.getQuestProjectionReturns({ questId: PROJECTION_QUEST_ID, projection });
    },
    setupQuestNotFound: ({ cause }: { cause?: Error }): void => {
      orchestrator.getQuestProjectionThrows({
        questId: PROJECTION_QUEST_ID,
        error: Object.assign(new QuestNotFoundError({ questId: PROJECTION_QUEST_ID }), {
          ...(cause === undefined ? {} : { cause }),
        }),
      });
    },
    setupQuestLoadFails: ({ error }: { error: Error }): void => {
      orchestrator.getQuestProjectionThrows({ questId: PROJECTION_QUEST_ID, error });
    },
    callResponder: QuestProjectionResponder,
  };
};
