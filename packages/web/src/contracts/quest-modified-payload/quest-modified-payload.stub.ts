import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questModifiedPayloadContract } from './quest-modified-payload-contract';
import type { QuestModifiedPayload } from './quest-modified-payload-contract';

export const QuestModifiedPayloadStub = ({
  ...props
}: StubArgument<QuestModifiedPayload> = {}): QuestModifiedPayload =>
  questModifiedPayloadContract.parse({
    questId: QuestIdStub(),
    quest: {},
    ...props,
  });
