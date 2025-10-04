import type { z } from 'zod';
import type { ViolationDetail } from './violation-detail-contract';
import { violationDetailContract } from './violation-detail-contract';

type UnbrandedInput<T extends z.ZodTypeAny> = Partial<z.input<T>>;

export const ViolationDetailStub = (
  overrides: UnbrandedInput<typeof violationDetailContract> = {},
): ViolationDetail =>
  violationDetailContract.parse({
    ruleId: '@typescript-eslint/no-explicit-any',
    line: 1,
    column: 15,
    message: 'Unexpected any. Specify a different type.',
    ...overrides,
  });
