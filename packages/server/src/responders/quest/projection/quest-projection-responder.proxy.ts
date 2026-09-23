import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestProjectionAdapterProxy } from '../../../adapters/orchestrator/get-quest-projection/orchestrator-get-quest-projection-adapter.proxy';
import { QuestProjectionResponder } from './quest-projection-responder';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

// Matches the literal VALID_QUEST_ID every test in quest-projection-responder.test.ts passes — the
// responder hands params.questId straight to the adapter, so the mocked address must match it.
const PROJECTION_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

export const QuestProjectionResponderProxy = (): {
  setupProjection: (params: { projection: QuestProjection }) => void;
  setupQuestNotFound: (params: { message: string }) => void;
  setupQuestNotFoundWithCause: (params: { error: Error }) => void;
  callResponder: typeof QuestProjectionResponder;
} => {
  const adapterProxy = orchestratorGetQuestProjectionAdapterProxy();

  return {
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      adapterProxy.returns({ questId: PROJECTION_QUEST_ID, projection });
    },
    setupQuestNotFound: ({ message }: { message: string }): void => {
      adapterProxy.throws({ questId: PROJECTION_QUEST_ID, error: new Error(message) });
    },
    // A load failure that wraps its own root cause — the shape the responder's reason formatter
    // unwinds one level of, so the browser sees the fs error behind the missing quest.
    setupQuestNotFoundWithCause: ({ error }: { error: Error }): void => {
      adapterProxy.throws({ questId: PROJECTION_QUEST_ID, error });
    },
    callResponder: QuestProjectionResponder,
  };
};
