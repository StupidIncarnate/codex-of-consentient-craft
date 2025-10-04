import type { z } from 'zod';
import type { ViolationCount } from './violation-count-contract';
import { violationCountContract } from './violation-count-contract';
import { ViolationDetailStub } from '../violation-detail/violation-detail.stub';

type UnbrandedInput<T extends z.ZodTypeAny> = Partial<z.input<T>>;

export const ViolationCountStub = (
  overrides: UnbrandedInput<typeof violationCountContract> = {},
): ViolationCount =>
  violationCountContract.parse({
    ruleId: '@typescript-eslint/no-explicit-any',
    count: 1,
    details: [ViolationDetailStub()],
    ...overrides,
  });
