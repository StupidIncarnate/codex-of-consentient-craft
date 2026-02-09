/**
 * PURPOSE: Stub factory for GetQuestStatusResult contract test data
 *
 * USAGE:
 * const result = GetQuestStatusResultStub({ success: true });
 * // Returns: GetQuestStatusResult with specified or default values
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestStatusResultContract } from './get-quest-status-result-contract';
import type { GetQuestStatusResult } from './get-quest-status-result-contract';

export const GetQuestStatusResultStub = ({
  ...props
}: StubArgument<GetQuestStatusResult> = {}): GetQuestStatusResult =>
  getQuestStatusResultContract.parse({
    success: true,
    ...props,
  });
