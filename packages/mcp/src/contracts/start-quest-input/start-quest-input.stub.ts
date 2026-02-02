/**
 * PURPOSE: Stub factory for StartQuestInput contract test data
 *
 * USAGE:
 * const input = StartQuestInputStub({ questId: 'add-auth' });
 * // Returns: StartQuestInput with specified or default values
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { startQuestInputContract } from './start-quest-input-contract';
import type { StartQuestInput } from './start-quest-input-contract';

export const StartQuestInputStub = ({
  ...props
}: StubArgument<StartQuestInput> = {}): StartQuestInput =>
  startQuestInputContract.parse({
    questId: 'test-quest-id',
    ...props,
  });
