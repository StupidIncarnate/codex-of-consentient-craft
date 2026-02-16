import type { StubArgument } from '@dungeonmaster/shared/@types';
import { checkResultContract, type CheckResult } from './check-result-contract';

export const CheckResultStub = ({ ...props }: StubArgument<CheckResult> = {}): CheckResult =>
  checkResultContract.parse({
    checkType: 'lint',
    status: 'pass',
    projectResults: [],
    ...props,
  });
