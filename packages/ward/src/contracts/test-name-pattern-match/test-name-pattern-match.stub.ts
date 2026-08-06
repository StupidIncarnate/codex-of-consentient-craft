import { testNamePatternMatchContract } from './test-name-pattern-match-contract';
import type { TestNamePatternMatch } from './test-name-pattern-match-contract';

export const TestNamePatternMatchStub = ({
  value,
}: { value?: string } = {}): TestNamePatternMatch =>
  testNamePatternMatchContract.parse(value ?? 'matched');
