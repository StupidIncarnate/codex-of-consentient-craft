/**
 * PURPOSE: Stub factory for ListQuestsInput contract test data
 *
 * USAGE:
 * const input = ListQuestsInputStub({ startPath: '/my/project' });
 * // Returns: ListQuestsInput with specified or default values
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { listQuestsInputContract } from './list-quests-input-contract';
import type { ListQuestsInput } from './list-quests-input-contract';

export const ListQuestsInputStub = ({
  ...props
}: StubArgument<ListQuestsInput> = {}): ListQuestsInput =>
  listQuestsInputContract.parse({
    startPath: '/test/project',
    ...props,
  });
