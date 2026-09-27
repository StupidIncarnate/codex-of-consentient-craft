import type { StubArgument } from '../../@types/stub-argument.type';

import { verifyQuestCheckContract } from './verify-quest-check-contract';
import type { VerifyQuestCheck } from './verify-quest-check-contract';

export const VerifyQuestCheckStub = ({
  ...props
}: StubArgument<VerifyQuestCheck> = {}): VerifyQuestCheck =>
  verifyQuestCheckContract.parse({
    name: 'Test Check',
    passed: true,
    details: 'All checks passed',
    ...props,
  });
