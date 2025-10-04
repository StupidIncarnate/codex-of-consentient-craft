import type { z } from 'zod';
import type { LintMessage } from './lint-message-contract';
import { lintMessageContract } from './lint-message-contract';

type UnbrandedInput<T extends z.ZodTypeAny> = Partial<z.input<T>>;

export const LintMessageStub = (
  overrides: UnbrandedInput<typeof lintMessageContract> = {},
): LintMessage =>
  lintMessageContract.parse({
    line: 1,
    column: 15,
    message: 'Unexpected any. Specify a different type.',
    severity: 2,
    ruleId: '@typescript-eslint/no-explicit-any',
    ...overrides,
  });
