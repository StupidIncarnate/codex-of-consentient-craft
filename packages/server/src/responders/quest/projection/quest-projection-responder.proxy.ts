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
  setupQuestNotFound: (params: { message: string; cause?: Error }) => void;
  setupQuestLoadFails: (params: { error: Error }) => void;
  callResponder: typeof QuestProjectionResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      orchestrator.getQuestProjectionReturns({ questId: PROJECTION_QUEST_ID, projection });
    },
    // The orchestrator's missing-quest error is named QuestNotFoundError; its class is not exported
    // from the orchestrator barrel, so the staged error carries the same name.
    setupQuestNotFound: ({ message, cause }: { message: string; cause?: Error }): void => {
      orchestrator.getQuestProjectionThrows({
        questId: PROJECTION_QUEST_ID,
        error: Object.assign(new Error(message, cause === undefined ? undefined : { cause }), {
          name: 'QuestNotFoundError',
        }),
      });
    },
    setupQuestLoadFails: ({ error }: { error: Error }): void => {
      orchestrator.getQuestProjectionThrows({ questId: PROJECTION_QUEST_ID, error });
    },
    callResponder: QuestProjectionResponder,
  };
};
