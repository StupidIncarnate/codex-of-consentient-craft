import type { ViolationCount } from './violation-count-contract';
import { violationCountContract } from './violation-count-contract';
import { ViolationDetailStub } from '../violation-detail/violation-detail.stub';
import type { StubArgument } from '@questmaestro/shared/@types';

export const ViolationCountStub = ({
  ...props
}: StubArgument<ViolationCount> = {}): ViolationCount =>
  violationCountContract.parse({
    ruleId: '@typescript-eslint/no-explicit-any',
    count: 1,
    details: [ViolationDetailStub()],
    ...props,
  });
