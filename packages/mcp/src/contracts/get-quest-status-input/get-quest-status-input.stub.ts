/**
 * PURPOSE: Stub factory for GetQuestStatusInput contract test data
 *
 * USAGE:
 * const input = GetQuestStatusInputStub({ processId: 'proc-123' });
 * // Returns: GetQuestStatusInput with specified or default values
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestStatusInputContract } from './get-quest-status-input-contract';
import type { GetQuestStatusInput } from './get-quest-status-input-contract';

export const GetQuestStatusInputStub = ({
  ...props
}: StubArgument<GetQuestStatusInput> = {}): GetQuestStatusInput =>
  getQuestStatusInputContract.parse({
    processId: 'proc-test-123',
    ...props,
  });
