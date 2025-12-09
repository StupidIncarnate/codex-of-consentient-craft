import type { LintMessage } from './lint-message-contract';
import { lintMessageContract } from './lint-message-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const LintMessageStub = ({ ...props }: StubArgument<LintMessage> = {}): LintMessage =>
  lintMessageContract.parse({
    line: 1,
    column: 1,
    message: 'Unexpected any. Specify a different type.',
    severity: 2,
    ruleId: '@typescript-eslint/no-explicit-any',
    ...props,
  });
