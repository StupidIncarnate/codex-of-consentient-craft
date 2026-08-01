import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questLoadFailedPayloadContract } from './quest-load-failed-payload-contract';
import type { QuestLoadFailedPayload } from './quest-load-failed-payload-contract';

export const QuestLoadFailedPayloadStub = ({
  ...props
}: StubArgument<QuestLoadFailedPayload> = {}): QuestLoadFailedPayload =>
  questLoadFailedPayloadContract.parse({
    questId: QuestIdStub(),
    error:
      'Failed to parse quest file at /quests/q1/quest.json: comments.0.createdAt: Invalid datetime',
    ...props,
  });
