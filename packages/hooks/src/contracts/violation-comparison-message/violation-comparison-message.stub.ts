import { violationComparisonMessageContract } from './violation-comparison-message-contract';
import type { ViolationComparisonMessage } from './violation-comparison-message-contract';

export const ViolationComparisonMessageStub = (
  { value }: { value: string } = {
    value: '🛑 New code quality violations detected:\n\nTest violation message',
  },
): ViolationComparisonMessage => violationComparisonMessageContract.parse(value);
