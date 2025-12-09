import type { ViolationDetail } from './violation-detail-contract';
import { violationDetailContract } from './violation-detail-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ViolationDetailStub = ({
  ...props
}: StubArgument<ViolationDetail> = {}): ViolationDetail =>
  violationDetailContract.parse({
    ruleId: '@typescript-eslint/no-explicit-any',
    line: 1,
    column: 15,
    message: 'Unexpected any. Specify a different type.',
    ...props,
  });
