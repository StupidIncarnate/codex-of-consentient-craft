import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questOutboxLineContract } from './quest-outbox-line-contract';
import type { QuestOutboxLine } from './quest-outbox-line-contract';

export const QuestOutboxLineStub = ({
  ...props
}: StubArgument<QuestOutboxLine> = {}): QuestOutboxLine =>
  questOutboxLineContract.parse({
    questId: QuestIdStub().toString(),
    timestamp: '2024-01-15T10:00:00.000Z',
    ...props,
  });
