import type { z } from 'zod';
import type { LintResult } from './lint-result-contract';
import { lintResultContract } from './lint-result-contract';
import { LintMessageStub } from '../lint-message/lint-message.stub';

type UnbrandedInput<T extends z.ZodTypeAny> = Partial<z.input<T>>;

export const LintResultStub = (
  overrides: UnbrandedInput<typeof lintResultContract> = {},
): LintResult =>
  lintResultContract.parse({
    filePath: '/test/file.ts',
    messages: [LintMessageStub()],
    errorCount: 1,
    warningCount: 0,
    ...overrides,
  });
