/**
 * PURPOSE: Stub factory for ListQuestsResult contract test data
 *
 * USAGE:
 * const result = ListQuestsResultStub({ success: true, quests: [] });
 * // Returns: ListQuestsResult with specified or default values
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { listQuestsResultContract } from './list-quests-result-contract';
import type { ListQuestsResult } from './list-quests-result-contract';

export const ListQuestsResultStub = ({
  ...props
}: StubArgument<ListQuestsResult> = {}): ListQuestsResult =>
  listQuestsResultContract.parse({
    success: true,
    quests: [],
    ...props,
  });
