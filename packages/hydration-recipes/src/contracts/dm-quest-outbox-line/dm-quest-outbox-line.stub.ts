/**
 * PURPOSE: Builds a valid `DmQuestOutboxLine` for a test that needs one but does not care about
 * the exact questId or timestamp.
 *
 * USAGE:
 * DmQuestOutboxLineStub({ questId: QuestIdStub() });
 * // Returns DmQuestOutboxLine
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dmQuestOutboxLineContract } from './dm-quest-outbox-line-contract';
import type { DmQuestOutboxLine } from './dm-quest-outbox-line-contract';

export const DmQuestOutboxLineStub = ({
  ...props
}: StubArgument<DmQuestOutboxLine> = {}): DmQuestOutboxLine =>
  dmQuestOutboxLineContract.parse({
    questId: 'add-auth',
    timestamp: '2024-01-15T10:00:00.000Z',
    ...props,
  });
