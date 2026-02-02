/**
 * PURPOSE: Stub factory for StartQuestResult contract test data
 *
 * USAGE:
 * const result = StartQuestResultStub({ success: true, processId: 'proc-123' });
 * // Returns: StartQuestResult with specified or default values
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { startQuestResultContract } from './start-quest-result-contract';
import type { StartQuestResult } from './start-quest-result-contract';

export const StartQuestResultStub = ({
  ...props
}: StubArgument<StartQuestResult> = {}): StartQuestResult =>
  startQuestResultContract.parse({
    success: true,
    processId: 'proc-test-123',
    ...props,
  });
