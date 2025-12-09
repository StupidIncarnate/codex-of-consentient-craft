import type { ViolationComparison } from './violation-comparison-contract';
import { violationComparisonContract } from './violation-comparison-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ViolationComparisonStub = ({
  ...props
}: StubArgument<ViolationComparison> = {}): ViolationComparison =>
  violationComparisonContract.parse({
    hasNewViolations: false,
    newViolations: [],
    message: 'No new violations detected',
    ...props,
  });
