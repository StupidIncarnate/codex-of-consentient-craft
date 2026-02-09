import type { StubArgument } from '@dungeonmaster/shared/@types';

import { verifyQuestResultContract } from './verify-quest-result-contract';
import type { VerifyQuestResult } from './verify-quest-result-contract';

export const VerifyQuestResultStub = ({
  ...props
}: StubArgument<VerifyQuestResult> = {}): VerifyQuestResult =>
  verifyQuestResultContract.parse({
    success: true,
    checks: [],
    ...props,
  });
