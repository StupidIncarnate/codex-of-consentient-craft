import type { StubArgument } from '@dungeonmaster/shared/@types';

import { verifyQuestInputContract } from './verify-quest-input-contract';
import type { VerifyQuestInput } from './verify-quest-input-contract';

export const VerifyQuestInputStub = ({
  ...props
}: StubArgument<VerifyQuestInput> = {}): VerifyQuestInput =>
  verifyQuestInputContract.parse({
    questId: 'test-quest',
    ...props,
  });
