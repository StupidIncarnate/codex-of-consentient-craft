import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questModifiedPayloadContract } from './quest-modified-payload-contract';
import type { QuestModifiedPayload } from './quest-modified-payload-contract';

export const QuestModifiedPayloadStub = ({
  ...props
}: StubArgument<QuestModifiedPayload> = {}): QuestModifiedPayload =>
  questModifiedPayloadContract.parse({
    questId: QuestStub().id,
    quest: QuestStub(),
    ...props,
  });
